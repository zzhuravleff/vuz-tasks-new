const HappyMiniPet = () => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      fill="none"
    >
      {/* Голова */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#97C459"
      />

      {/* Глаза */}
      <circle
        cx="38"
        cy="42"
        r="4"
        fill="#2C5A0E"
      />

      <circle
        cx="62"
        cy="42"
        r="4"
        fill="#2C5A0E"
      />

      {/* Улыбка */}
      <path
        d="M38 58 Q50 68 62 58"
        stroke="#2C5A0E"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default HappyMiniPet;