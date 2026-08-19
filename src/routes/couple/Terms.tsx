import { ScreenHeader } from '@/components/layout/ScreenHeader'

/** Store-compliance surface. Canonical copy lives on weddingmall.online. */
export default function Terms() {
  return (
    <div className="pb-8">
      <ScreenHeader title="Terms of Use" back />
      <div className="space-y-4 px-4 text-[15px] leading-relaxed text-ink-soft">
        <p>
          Wedding Mall connects couples with wedding venues and service providers across India. By
          using this app you agree to use it lawfully and to provide accurate information when
          submitting an enquiry.
        </p>
        <h2 className="text-lg text-ink">Enquiries</h2>
        <p>
          When you submit an enquiry, your name, mobile number and (if provided) wedding date are
          shared with that vendor so they can contact you. Vendors are independent businesses;
          Wedding Mall does not guarantee availability or pricing.
        </p>
        <h2 className="text-lg text-ink">Content</h2>
        <p>
          Listing photos, descriptions and pricing are supplied by vendors and may change. Report
          inaccurate content to support and we will review it.
        </p>
        <h2 className="text-lg text-ink">Contact</h2>
        <p>
          For the full and current terms, visit{' '}
          <a className="font-semibold text-[var(--color-primary)]" href="https://weddingmall.online/">
            weddingmall.online
          </a>
          .
        </p>
      </div>
    </div>
  )
}
