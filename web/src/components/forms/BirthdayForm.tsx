import { useState } from 'react'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { ImageUpload } from '../ui/ImageUpload'
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface BirthdayFormProps {
  values: Record<string, unknown>
  templateId?: string | null
  onChange: (fieldId: string, value: unknown) => void
}

export function BirthdayForm({ values, templateId, onChange }: BirthdayFormProps) {
  const [openSection, setOpenSection] = useState<string | null>('details')

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  const renderToggle = (key: string, label: string) => {
    const isDefault = values[key] !== false
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
            <Sparkles size={10} /> Option
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => onChange(key, true)}
            className={`py-2 px-3 rounded-lg transition-all ${isDefault ? 'bg-white dark:bg-ink shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'}`}
          >
            Use Default Content
          </button>
          <button
            type="button"
            onClick={() => onChange(key, false)}
            className={`py-2 px-3 rounded-lg transition-all ${!isDefault ? 'bg-white dark:bg-ink shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'}`}
          >
            Customize Manually
          </button>
        </div>
      </div>
    )
  }

  const renderSectionHeader = (id: string, title: string, subtitle: string, isComplete: boolean) => {
    const isOpen = openSection === id
    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-5 border-b border-black/10 dark:border-white/10 text-left hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors focus-visible:outline-none"
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-ink dark:text-white">{title}</h3>
            {isComplete ? (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-mint/10 text-mint border border-mint/20">Done</span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{subtitle}</p>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
      </button>
    )
  }

  const timeline = Array.isArray(values.timeline) ? values.timeline : []
  const handleAddTimeline = () => {
    if (timeline.length >= 6) return
    const newItem = { year: '', title: '', body: '' }
    onChange('timeline', [...timeline, newItem])
  }
  const handleRemoveTimeline = (index: number) => {
    onChange('timeline', timeline.filter((_, i) => i !== index))
  }
  const handleUpdateTimeline = (index: number, key: 'year' | 'title' | 'body', val: string) => {
    const updated = timeline.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: val }
      }
      return item
    })
    onChange('timeline', updated)
  }

  const constellation = Array.isArray(values.constellation) ? values.constellation : []
  const handleAddConstellation = () => {
    if (constellation.length >= 6) return
    const newItem = { title: '', body: '' }
    onChange('constellation', [...constellation, newItem])
  }
  const handleRemoveConstellation = (index: number) => {
    onChange('constellation', constellation.filter((_, i) => i !== index))
  }
  const handleUpdateConstellation = (index: number, key: 'title' | 'body', val: string) => {
    const updated = constellation.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: val }
      }
      return item
    })
    onChange('constellation', updated)
  }

  const photos = Array.isArray(values.photos) ? values.photos : []
  const memoryCaptions = Array.isArray(values.memoryCaptions) ? values.memoryCaptions : []
  const handleUpdateCaption = (index: number, val: string) => {
    const updated = [...memoryCaptions]
    updated[index] = val
    onChange('memoryCaptions', updated)
  }

  return (
    <div className="space-y-4">
      {/* 1. Recipient & Sender Details */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'details', 
          '1. Names & Details', 
          'Configure recipient and sender identities.', 
          Boolean(values.recipient_name && values.sender_name)
        )}
        {openSection === 'details' && (
          <div className="p-5 space-y-4 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            <Input 
              label="Recipient's Name (Required)" 
              placeholder="e.g. Amelia"
              value={typeof values.recipient_name === 'string' ? values.recipient_name : ''}
              onChange={(e) => onChange('recipient_name', e.target.value)}
              required
            />
            <Input 
              label="Recipient's Nickname" 
              placeholder="e.g. Mia"
              value={typeof values.nickname === 'string' ? values.nickname : ''}
              onChange={(e) => onChange('nickname', e.target.value)}
            />
            <Input 
              label="Your Name (Sender) (Required)" 
              placeholder="e.g. Daniel"
              value={typeof values.sender_name === 'string' ? values.sender_name : ''}
              onChange={(e) => onChange('sender_name', e.target.value)}
              required
            />
            <Input 
              label="Celebration Date / Birthday" 
              placeholder="e.g. December 4th"
              value={typeof values.birthday === 'string' ? values.birthday : ''}
              onChange={(e) => onChange('birthday', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 2. Journey Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'journey', 
          '2. Journey Tagline', 
          'The opening emotional hooks of the page.', 
          true
        )}
        {openSection === 'journey' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultJourney', 'Journey Section')}
            {values.useDefaultJourney === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <Input 
                  label="Opening Tagline" 
                  placeholder="e.g. A quiet love letter, written in light."
                  value={typeof values.tagline === 'string' ? values.tagline : ''}
                  onChange={(e) => onChange('tagline', e.target.value)}
                />
                <Textarea 
                  label="Intro Message" 
                  placeholder="Today the world feels a little brighter..."
                  value={typeof values.message === 'string' ? values.message : ''}
                  onChange={(e) => onChange('message', e.target.value)}
                  maxLength={300}
                />
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using premium defaults: "A quiet love letter..." and "Today the world feels a little brighter..."
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Quote Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'quote', 
          '3. Inspiring Quote', 
          'An elegant floating quote block.', 
          true
        )}
        {openSection === 'quote' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultQuote', 'Quote Section')}
            {values.useDefaultQuote === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <Input 
                  label="Quote Text" 
                  placeholder="e.g. Count not the candles... see the lights they give."
                  value={typeof values.quoteText === 'string' ? values.quoteText : ''}
                  onChange={(e) => onChange('quoteText', e.target.value)}
                />
                <Input 
                  label="Quote Author" 
                  placeholder="e.g. William Arthur Ward"
                  value={typeof values.quoteAuthor === 'string' ? values.quoteAuthor : ''}
                  onChange={(e) => onChange('quoteAuthor', e.target.value)}
                />
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using default quote by William Arthur Ward.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4. Memories Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'memories', 
          '4. Memory Gallery', 
          'A beautiful mosaic photo layout.', 
          true
        )}
        {openSection === 'memories' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultMemories', 'Memories Gallery')}
            {values.useDefaultMemories === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <label className="text-sm font-semibold text-ink dark:text-white/90 block">Upload Gallery Images (Up to 6)</label>
                <ImageUpload 
                  urls={photos}
                  onUploaded={(url) => onChange('photos', [...photos, url].slice(0, 6))}
                  onRemove={(url) => {
                    const idx = photos.indexOf(url)
                    onChange('photos', photos.filter((u) => u !== url))
                    if (idx > -1) {
                      onChange('memoryCaptions', memoryCaptions.filter((_, i) => i !== idx))
                    }
                  }}
                  templateId={templateId}
                />
                
                {photos.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Image Captions</span>
                    {photos.map((url, i) => (
                      <Input 
                        key={i}
                        label={`Photo ${i + 1} Caption`}
                        placeholder="e.g. Golden hour rooftop..."
                        value={memoryCaptions[i] || ''}
                        onChange={(e) => handleUpdateCaption(i, e.target.value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using default gallery photos and captions.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. Timeline Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'timeline', 
          '5. Timeline Chapters', 
          'A vertical scrolling history of key milestones.', 
          true
        )}
        {openSection === 'timeline' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultTimeline', 'Timeline Section')}
            {values.useDefaultTimeline === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Milestones ({timeline.length}/6)</span>
                  {timeline.length < 6 && (
                    <button 
                      type="button" 
                      onClick={handleAddTimeline}
                      className="text-xs font-bold text-brand hover:text-plum flex items-center gap-1"
                    >
                      <Plus size={14} /> Add milestone
                    </button>
                  )}
                </div>
                
                {timeline.map((item, idx) => (
                  <div key={idx} className="p-4 border border-black/5 dark:border-white/5 rounded-xl bg-white dark:bg-zinc-800/30 relative space-y-3">
                    <button 
                      type="button"
                      onClick={() => handleRemoveTimeline(idx)}
                      className="absolute top-2 right-2 text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Remove milestone"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <Input 
                          label="Year" 
                          placeholder="e.g. 2012"
                          value={item.year}
                          onChange={(e) => handleUpdateTimeline(idx, 'year', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          label="Chapter Title" 
                          placeholder="e.g. We met"
                          value={item.title}
                          onChange={(e) => handleUpdateTimeline(idx, 'title', e.target.value)}
                        />
                      </div>
                    </div>
                    <Textarea 
                      label="Milestone Description" 
                      placeholder="e.g. A rainy library..."
                      value={item.body}
                      onChange={(e) => handleUpdateTimeline(idx, 'body', e.target.value)}
                      maxLength={150}
                    />
                  </div>
                ))}
                
                {timeline.length === 0 && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic text-center py-4">
                    No milestones defined. Add one using the button above.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using default timeline milestones (2012, 2015, 2018, 2021, 2024).
              </p>
            )}
          </div>
        )}
      </div>

      {/* 6. Personal Letter Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'letter', 
          '6. Personal Letter', 
          'A long-form heart-to-heart message.', 
          true
        )}
        {openSection === 'letter' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultLetter', 'Personal Letter')}
            {values.useDefaultLetter === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <Textarea 
                  label="Heart-to-Heart Letter" 
                  placeholder="Mia, There is a particular kind of magic..."
                  value={typeof values.personalLetter === 'string' ? values.personalLetter : ''}
                  onChange={(e) => onChange('personalLetter', e.target.value)}
                  maxLength={1000}
                />
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using default personal letter from the template.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 7. Secret Surprise Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'secret', 
          '7. Secret Reveal', 
          'A hidden toggle card containing a final surprise direction.', 
          true
        )}
        {openSection === 'secret' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultSecret', 'Secret Surprise')}
            {values.useDefaultSecret === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <Input 
                  label="Surprise Title" 
                  placeholder="e.g. There is one more thing..."
                  value={typeof values.secretTitle === 'string' ? values.secretTitle : ''}
                  onChange={(e) => onChange('secretTitle', e.target.value)}
                />
                <Textarea 
                  label="Surprise Body Details" 
                  placeholder="e.g. Look out your window at 8:47pm..."
                  value={typeof values.secretBody === 'string' ? values.secretBody : ''}
                  onChange={(e) => onChange('secretBody', e.target.value)}
                  maxLength={200}
                />
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using default surprise message: "Look out your window..."
              </p>
            )}
          </div>
        )}
      </div>

      {/* 8. Constellation Messages Section */}
      <div className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-soft">
        {renderSectionHeader(
          'constellation', 
          '8. Memory Constellation', 
          'Interactive starry sky with nodes for smaller micro-memories.', 
          true
        )}
        {openSection === 'constellation' && (
          <div className="p-5 border-t border-black/10 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
            {renderToggle('useDefaultConstellation', 'Memory Stars')}
            {values.useDefaultConstellation === false ? (
              <div className="space-y-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Star Nodes ({constellation.length}/6)</span>
                  {constellation.length < 6 && (
                    <button 
                      type="button" 
                      onClick={handleAddConstellation}
                      className="text-xs font-bold text-brand hover:text-plum flex items-center gap-1"
                    >
                      <Plus size={14} /> Add memory star
                    </button>
                  )}
                </div>
                
                {constellation.map((item, idx) => (
                  <div key={idx} className="p-4 border border-black/5 dark:border-white/5 rounded-xl bg-white dark:bg-zinc-800/30 relative space-y-3">
                    <button 
                      type="button"
                      onClick={() => handleRemoveConstellation(idx)}
                      className="absolute top-2 right-2 text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Remove star"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Input 
                      label={`Star ${idx + 1} Memory Title`} 
                      placeholder="e.g. First coffee"
                      value={item.title}
                      onChange={(e) => handleUpdateConstellation(idx, 'title', e.target.value)}
                    />
                    <Textarea 
                      label="Memory Star Text" 
                      placeholder="e.g. You ordered something impossible..."
                      value={item.body}
                      onChange={(e) => handleUpdateConstellation(idx, 'body', e.target.value)}
                      maxLength={120}
                    />
                  </div>
                ))}
                
                {constellation.length === 0 && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic text-center py-4">
                    No star memories defined. Add one using the button above.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium italic mt-2">
                Using default constellation memory stars (6 stars).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
