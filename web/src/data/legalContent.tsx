export interface LegalSection {
  id: string
  title: string
  content: React.ReactNode
}

export const PRIVACY_POLICY: LegalSection[] = [
  {
    id: 'about',
    title: 'About This Policy',
    content: (
      <p>
        WishCraft respects user privacy and explains how information is collected and protected.
      </p>
    )
  },
  {
    id: 'collected-info',
    title: 'Information We Collect',
    content: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Name</li>
        <li>Email</li>
        <li>Uploaded Photos</li>
        <li>Wish Content</li>
        <li>Music Selection</li>
        <li>Preferences</li>
      </ul>
    )
  },
  {
    id: 'data-use',
    title: 'How We Use Your Data',
    content: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Create wishes</li>
        <li>Save drafts</li>
        <li>Publish wishes</li>
        <li>Improve services</li>
        <li>Secure accounts</li>
      </ul>
    )
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    content: (
      <div className="space-y-4">
        <p>We never sell personal data.</p>
        <p>Information is only used to provide the service.</p>
        <p>We use secure cloud infrastructure to keep your data safe.</p>
      </div>
    )
  },
  {
    id: 'wish-expiration',
    title: 'Wish Expiration',
    content: (
      <div className="space-y-4">
        <p>
          Published wishes automatically expire after <strong className="text-brand font-bold">24 hours</strong>.
        </p>
        <p>
          After expiration, the wish becomes inaccessible unless future premium features introduce extended availability.
        </p>
      </div>
    )
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Essential cookies</li>
        <li>Authentication</li>
        <li>Preferences</li>
        <li>Performance</li>
      </ul>
    )
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Edit profile</li>
        <li>Delete account</li>
        <li>Export data (if implemented)</li>
      </ul>
    )
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <div className="space-y-4">
        <p>Secure authentication</p>
        <p>Encrypted communication</p>
        <p>Protected storage</p>
        <p>Industry best practices</p>
      </div>
    )
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>Support (support@wishcraft.com)</p>
    )
  }
]

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance',
    content: (
      <p>By using WishCraft, you agree to these terms.</p>
    )
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    content: (
      <div className="space-y-2">
        <p>Users must not upload:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Illegal content</li>
          <li>Malware</li>
          <li>Copyrighted material</li>
          <li>Hate speech</li>
          <li>Abusive content</li>
        </ul>
      </div>
    )
  },
  {
    id: 'ownership',
    title: 'Ownership',
    content: (
      <div className="space-y-4">
        <p>Users own the wishes they create.</p>
        <p>WishCraft provides the platform for creating and sharing them.</p>
      </div>
    )
  },
  {
    id: 'wish-availability',
    title: 'Wish Availability',
    content: (
      <div className="space-y-4">
        <p>
          Published wishes remain accessible for <strong className="text-brand font-bold">24 hours</strong>.
        </p>
        <p>After expiration, they automatically become unavailable.</p>
      </div>
    )
  },
  {
    id: 'account-responsibility',
    title: 'Account Responsibility',
    content: (
      <div className="space-y-2">
        <p>Users are responsible for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Account security</li>
          <li>Passwords</li>
          <li>Shared links</li>
        </ul>
      </div>
    )
  },
  {
    id: 'service-availability',
    title: 'Service Availability',
    content: (
      <p>WishCraft may evolve, receive updates, or temporarily undergo maintenance.</p>
    )
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: (
      <p>WishCraft is provided "as is" without any warranties. We are not liable for any damages arising from the use of the platform.</p>
    )
  },
  {
    id: 'changes',
    title: 'Changes to These Terms',
    content: (
      <p>Terms may change over time. Users will always see the latest version.</p>
    )
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>Support (support@wishcraft.com)</p>
    )
  }
]
