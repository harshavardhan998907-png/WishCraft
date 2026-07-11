import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Loader } from '../components/ui/Loader'
import type { TemplateProps } from './types'

interface ExternalTemplateRendererProps {
  /** Public URL of the creator bundle (IIFE exposing the WishCraftTemplate global). */
  bundleUrl: string
  props: TemplateProps
  className?: string
  fallback?: ReactNode
  errorFallback?: ReactNode
}

type LoadStatus = 'loading' | 'ready' | 'error'

// Messages exchanged with the sandboxed iframe.
const READY_MESSAGE = 'WISHCRAFT_PREVIEW_READY'
const UPDATE_MESSAGE = 'WISHCRAFT_UPDATE_PROPS'

// Stop the bundle source from prematurely closing the inline <script> tag.
function escapeForScript(source: string): string {
  return source.replace(/<\/(script)/gi, '<\\/$1')
}

// Escape a JSON payload for safe embedding inside an inline <script>.
function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/**
 * Builds the self-contained HTML document that runs inside the sandboxed iframe.
 * React + ReactDOM load from the CDN, a `require` shim maps the bundle's
 * react/jsx-runtime import onto the CDN globals, the bundle is inlined, and the
 * exported component is mounted once. Prop updates arrive via postMessage and
 * re-render in place (no remount) so internal state/animation survives editing.
 */
function buildIframeHtml(bundleSource: string, initialProps: TemplateProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html,body{margin:0;padding:0;height:100%;width:100%;}
  #root{min-height:100%;width:100%;}
  #wc-error{display:none;padding:24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:13px;line-height:1.5;color:#b91c1c;background:#fff;white-space:pre-wrap;}
</style>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script>
  // esbuild builds creator bundles as IIFEs with react/react-dom external, so at
  // runtime they call require("react/jsx-runtime"). esbuild's shim uses the
  // global require when one exists; provide it, mapping module names to the CDN
  // globals. Without this the bundle throws and never defines WishCraftTemplate.
  window.require = function (name) {
    var R = window.React;
    if (name === 'react') return R;
    if (name === 'react-dom' || name === 'react-dom/client') return window.ReactDOM;
    if (name === 'react/jsx-runtime' || name === 'react/jsx-dev-runtime') {
      var jsx = function (type, config, maybeKey) {
        var props = Object.assign({}, config);
        if (maybeKey !== undefined) props.key = maybeKey;
        return R.createElement(type, props);
      };
      return { jsx: jsx, jsxs: jsx, jsxDEV: jsx, Fragment: R.Fragment };
    }
    throw new Error('Module not available: ' + name);
  };
  function showError(message) {
    var box = document.getElementById('wc-error');
    if (box) { box.textContent = 'Template error: ' + message; box.style.display = 'block'; }
  }
  window.addEventListener('error', function (event) {
    showError((event.error && event.error.message) || event.message || 'Unknown error');
  });
</script>
</head>
<body>
<div id="root"></div>
<div id="wc-error"></div>
<script>${escapeForScript(bundleSource)}</script>
<script>
  (function () {
    var exported = window.WishCraftTemplate;
    var Template = exported && (exported.default != null ? exported.default : exported);
    if (typeof Template !== 'function') {
      showError('bundle did not export a renderable WishCraftTemplate component');
      return;
    }

    // Error boundary that recovers when a new prop version arrives, so a bad
    // intermediate edit doesn't permanently break the live preview.
    function Boundary(props) { React.Component.call(this, props); this.state = { error: null, version: props.version }; }
    Boundary.prototype = Object.create(React.Component.prototype);
    Boundary.getDerivedStateFromError = function (error) { return { error: error }; };
    Boundary.getDerivedStateFromProps = function (props, state) {
      if (props.version !== state.version) return { error: null, version: props.version };
      return null;
    };
    Boundary.prototype.render = function () {
      if (this.state.error) {
        return React.createElement('pre', {
          style: { padding: 20, margin: 0, color: '#b91c1c', background: '#fff',
            fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, whiteSpace: 'pre-wrap' },
        }, 'Template render failed:\\n' + (this.state.error.message || String(this.state.error)));
      }
      return React.createElement(Template, this.props.componentProps);
    };

    var root = ReactDOM.createRoot(document.getElementById('root'));
    var version = 0;
    function renderProps(props) {
      version += 1;
      root.render(React.createElement(Boundary, { version: version, componentProps: props }));
    }

    // Re-render in place when the parent posts new props.
    window.addEventListener('message', function (event) {
      if (event.source !== window.parent) return;
      var data = event.data;
      if (data && data.type === ${JSON.stringify(UPDATE_MESSAGE)} && data.props) {
        renderProps(data.props);
      }
    });

    renderProps(${escapeJsonForScript(initialProps)});

    // Tell the parent we're listening so it can flush the latest props.
    try { window.parent.postMessage({ type: ${JSON.stringify(READY_MESSAGE)} }, '*'); } catch (e) {}
  })();
</script>
</body>
</html>`
}

export function ExternalTemplateRenderer({
  bundleUrl,
  props,
  className,
  fallback,
  errorFallback,
}: ExternalTemplateRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  // Bundle text cached per URL so prop edits never re-fetch.
  const bundleCacheRef = useRef<Map<string, string>>(new Map())
  // Latest props + iframe readiness, read inside async/message callbacks.
  const latestPropsRef = useRef<TemplateProps>(props)
  const readyRef = useRef(false)

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  latestPropsRef.current = props

  // Fetch the bundle once per URL and build a same-origin Blob document for the
  // iframe. The iframe renders as real text/html (a Blob URL inherits the app
  // origin) even though the bundle is untrusted, because the iframe is sandboxed.
  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    readyRef.current = false
    setStatus('loading')
    setErrorMessage(null)

    async function load() {
      try {
        const cache = bundleCacheRef.current
        let bundleSource = cache.get(bundleUrl)
        if (bundleSource === undefined) {
          const response = await fetch(bundleUrl)
          if (!response.ok) {
            throw new Error(`Failed to load template bundle (status ${response.status})`)
          }
          bundleSource = await response.text()
          cache.set(bundleUrl, bundleSource)
        }
        if (cancelled) return

        const html = buildIframeHtml(bundleSource, latestPropsRef.current)
        const blob = new Blob([html], { type: 'text/html' })
        createdUrl = URL.createObjectURL(blob)
        setBlobUrl(createdUrl)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load template')
        setStatus('error')
      }
    }

    void load()

    return () => {
      cancelled = true
      readyRef.current = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [bundleUrl])

  // Once the iframe reports it is listening, flush the current props to it.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const frame = iframeRef.current
      if (!frame || event.source !== frame.contentWindow) return
      const data = event.data as { type?: string } | null
      if (data?.type === READY_MESSAGE) {
        readyRef.current = true
        frame.contentWindow?.postMessage(
          { type: UPDATE_MESSAGE, props: latestPropsRef.current },
          '*',
        )
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Push prop updates into the running iframe without reloading it.
  useEffect(() => {
    if (!readyRef.current) return
    iframeRef.current?.contentWindow?.postMessage({ type: UPDATE_MESSAGE, props }, '*')
  }, [props])

  if (status === 'error') {
    return (
      <>
        {errorFallback ?? (
          <div className="grid min-h-[520px] place-items-center rounded-lg bg-zinc-100 px-5 text-center font-semibold text-zinc-500 dark:bg-white/10 dark:text-white/55">
            {errorMessage ?? 'Template could not be loaded.'}
          </div>
        )}
      </>
    )
  }

  return (
    <div className={className} style={{ position: 'relative', minHeight: '100vh', height: '100%', width: '100%' }}>
      {status === 'loading' || !blobUrl ? (
        fallback ?? <Loader variant="fullPage" />
      ) : (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          title="Template preview"
          sandbox="allow-scripts"
          className="h-full w-full border-0"
          style={{ display: 'block', minHeight: '100vh', height: '100%', width: '100%', border: 0 }}
        />
      )}
    </div>
  )
}
