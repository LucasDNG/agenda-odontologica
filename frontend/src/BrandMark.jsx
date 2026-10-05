function BrandMark({
  className = "brand-mark",
}) {
  return (
    <div
      className={className}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24">
        <path
          d="M8.2 4.4c1-.9 2.2-1.4 3.8-1.4s2.8.5 3.8 1.4c1.2 1.1 2 2.7 1.8 4.6-.2 2.2-.8 4.3-.5 6.3.3 1.8-.4 3.4-1.8 3.7-1 .2-1.8-.7-2.2-1.9-.4-1-.9-1.3-1.6-1.3s-1.2.3-1.6 1.3c-.4 1.2-1.2 2.1-2.2 1.9-1.4-.3-2.1-1.9-1.8-3.7.3-2 .0-4.1-.5-6.3-.2-1.9.6-3.5 1.8-4.6z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default BrandMark;
