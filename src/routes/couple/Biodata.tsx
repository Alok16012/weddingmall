import { BiodataMaker } from '@/modules/biodata/BiodataMaker'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/**
 * Host route for the Biodata Maker.
 *
 * The page owns the app chrome; everything below the header comes from
 * `@/modules/biodata`, which knows nothing about this app. Porting the feature
 * to the Next.js site means copying that folder and writing this file again.
 */
export default function Biodata() {
  return (
    <div>
      <ScreenHeader title="Free Biodata" subtitle="Matrimonial biodata maker" />
      {/*
        Lift the module's sticky action bar clear of the fixed bottom tab bar,
        which is the one thing the module cannot know about on its own.
      */}
      <div
        className="px-4 pt-1 pb-6"
        style={
          {
            '--biodata-sticky-offset': 'calc(56px + env(safe-area-inset-bottom))',
          } as React.CSSProperties
        }
      >
        <BiodataMaker />
      </div>
    </div>
  )
}
