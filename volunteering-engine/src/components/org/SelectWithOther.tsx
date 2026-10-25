import type { ComponentProps } from 'react'
import { OTHER_NONPROFIT_TYPE } from '../../lib/nonprofitTypes'
import { Field, Input, Select } from '../ui/Field'

// A required dropdown, plus a text box that appears when "Other" is chosen.
// The form owns the values; this just lays out the two fields.
export function SelectWithOther({
  label,
  options,
  selected,
  selectProps,
  selectError,
  otherLabel,
  otherPlaceholder,
  otherProps,
  otherError,
}: {
  label: string
  options: readonly string[]
  selected: string | undefined
  selectProps: ComponentProps<'select'>
  selectError?: string
  otherLabel: string
  otherPlaceholder: string
  otherProps: ComponentProps<'input'>
  otherError?: string
}) {
  return (
    <>
      <Field label={label} error={selectError}>
        <Select aria-invalid={!!selectError} {...selectProps}>
          <option value="" disabled>
            Select one…
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>

      {selected === OTHER_NONPROFIT_TYPE && (
        <Field label={otherLabel} error={otherError}>
          <Input placeholder={otherPlaceholder} aria-invalid={!!otherError} {...otherProps} />
        </Field>
      )}
    </>
  )
}
