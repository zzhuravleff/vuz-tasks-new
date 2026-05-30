const SickFullPet = () => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      fill="none"
    >
      {/* Тело */}
      <ellipse
        cx="50"
        cy="58"
        rx="38"
        ry="28"
        fill="#F09595"
      />

      {/* Блик */}
      <ellipse
        cx="40"
        cy="45"
        rx="12"
        ry="6"
        transform="rotate(-25 40 45)"
        fill="rgba(255,255,255,0.1)"
      />

      {/* Уши */}
      <ellipse
        cx="18"
        cy="42"
        rx="7"
        ry="10"
        transform="rotate(-40 18 42)"
        fill="#C06060"
      />

      <ellipse
        cx="82"
        cy="42"
        rx="7"
        ry="10"
        transform="rotate(40 82 42)"
        fill="#C06060"
      />

      {/* Внутри ушей */}
      <ellipse
        cx="18"
        cy="42"
        rx="3.5"
        ry="5.5"
        transform="rotate(-40 18 42)"
        fill="#F7C1C1"
      />

      <ellipse
        cx="82"
        cy="42"
        rx="3.5"
        ry="5.5"
        transform="rotate(40 82 42)"
        fill="#F7C1C1"
      />

      {/* X глаза */}
      <path
        d="M33 48 L41 56 M41 48 L33 56"
        stroke="#A32D2D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M59 48 L67 56 M67 48 L59 56"
        stroke="#A32D2D"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Рот */}
      <path
        d="M42 66 Q50 62 58 66"
        stroke="#A32D2D"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Хвост */}
      <ellipse
        cx="82"
        cy="70"
        rx="7"
        ry="4"
        transform="rotate(25 82 70)"
        fill="#C06060"
      />

      {/* Звёздочки */}
      <circle
        cx="38"
        cy="18"
        r="2.8"
        fill="#EF9F27"
      />

      <circle
        cx="50"
        cy="12"
        r="2.8"
        fill="#EF9F27"
      />

      <circle
        cx="62"
        cy="18"
        r="2.8"
        fill="#EF9F27"
      />

      {/* Термометр */}
      <rect
        x="68"
        y="50"
        width="6"
        height="18"
        rx="3"
        fill="#E24B4A"
      />

      <rect
        x="70"
        y="52"
        width="2"
        height="10"
        rx="1"
        fill="#F7C1C1"
      />
    </svg>
  );
};

export default SickFullPet;