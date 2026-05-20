import type { ReactNode } from 'react'
import { ResponsiveCard } from './ResponsiveCard'

export interface ResponsiveTableColumn<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  priority?: 'primary' | 'secondary'
}

interface ResponsiveTableProps<T> {
  items: T[]
  columns: ResponsiveTableColumn<T>[]
  getKey: (item: T) => string
  emptyMessage: string
  loading?: boolean
}

export function ResponsiveTable<T>({ items, columns, getKey, emptyMessage, loading }: ResponsiveTableProps<T>) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#181824] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {items.map((item) => (
                <tr key={getKey(item)}>
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-4 align-top ${column.className ?? ''}`}>{column.render(item)}</td>
                  ))}
                </tr>
              ))}
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center font-semibold text-zinc-500" colSpan={columns.length}>{emptyMessage}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => {
          const primary = columns.filter((column) => column.priority === 'primary')
          const secondary = columns.filter((column) => column.priority !== 'primary')
          return (
            <ResponsiveCard key={getKey(item)} className="space-y-4">
              <div className="grid gap-3">
                {primary.map((column) => (
                  <div key={column.key}>{column.render(item)}</div>
                ))}
              </div>
              <dl className="grid gap-3 text-sm">
                {secondary.map((column) => (
                  <div key={column.key} className="grid gap-1">
                    <dt className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{column.header}</dt>
                    <dd className="min-w-0 font-semibold text-zinc-700 dark:text-white/75">{column.render(item)}</dd>
                  </div>
                ))}
              </dl>
            </ResponsiveCard>
          )
        })}
        {!loading && items.length === 0 ? <ResponsiveCard className="text-center font-semibold text-zinc-500">{emptyMessage}</ResponsiveCard> : null}
      </div>
    </>
  )
}
