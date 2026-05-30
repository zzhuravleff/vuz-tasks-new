const SickMiniPet = () => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      fill="none"
    >
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#F09595"
      />

      {/* X глаз */}
      <path
        d="M34 38 L42 46 M42 38 L34 46"
        stroke="#A32D2D"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M58 38 L66 46 M66 38 L58 46"
        stroke="#A32D2D"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* рот */}
      <line
        x1="42"
        y1="62"
        x2="58"
        y2="62"
        stroke="#A32D2D"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default SickMiniPet;