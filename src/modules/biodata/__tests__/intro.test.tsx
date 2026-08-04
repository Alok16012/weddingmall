import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Intro } from '../screens/Intro'
import { EMPTY_DRAFT, type BiodataDraft, type TemplateId } from '../types'

function renderIntro(selectedTemplate: TemplateId = 'classic') {
  const onSelectTemplate = vi.fn()
  render(
    <Intro
      hasDraft={false}
      draft={{ ...EMPTY_DRAFT, template: selectedTemplate }}
      onStart={vi.fn()}
      onResume={vi.fn()}
      onDiscard={vi.fn()}
      onSelectTemplate={onSelectTemplate}
    />,
  )
  return onSelectTemplate
}

function InteractiveIntro() {
  const [draft, setDraft] = useState<BiodataDraft>(EMPTY_DRAFT)
  return (
    <Intro
      hasDraft={false}
      draft={draft}
      onStart={vi.fn()}
      onResume={vi.fn()}
      onDiscard={vi.fn()}
      onSelectTemplate={(template) => setDraft((current) => ({ ...current, template }))}
    />
  )
}

describe('biodata format picker', () => {
  it('exposes all three formats as selectable buttons', () => {
    renderIntro()

    expect(screen.getByRole('button', { name: 'Select Classic Traditional biodata format' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Select Elegant Floral biodata format' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Select Modern Minimal biodata format' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('selects the format the user clicks', async () => {
    const user = userEvent.setup()
    const onSelectTemplate = renderIntro()

    await user.click(screen.getByRole('button', { name: 'Select Elegant Floral biodata format' }))

    expect(onSelectTemplate).toHaveBeenCalledOnce()
    expect(onSelectTemplate).toHaveBeenCalledWith('floral')
  })

  it('shows a visual preview that changes with the selected format', async () => {
    const user = userEvent.setup()
    render(<InteractiveIntro />)

    expect(screen.getByRole('region', { name: 'Classic Traditional format preview' })).toBeVisible()
    expect(screen.getByTestId('biodata-template-preview')).toHaveAttribute('data-template', 'classic')

    await user.click(screen.getByRole('button', { name: 'Select Elegant Floral biodata format' }))

    expect(screen.getByRole('region', { name: 'Elegant Floral format preview' })).toBeVisible()
    expect(screen.getByTestId('biodata-template-preview')).toHaveAttribute('data-template', 'floral')
  })
})
