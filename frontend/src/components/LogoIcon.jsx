export default function LogoIcon({ size = 16, className = '', title = '' }) {
  const ariaProps = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true, role: 'presentation' }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      {...ariaProps}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M16 8L20 16H12L16 8Z" fill="white" opacity="0.9" />
      <path d="M10 18H22L19 24H13L10 18Z" fill="white" />
    </svg>
  )
}


