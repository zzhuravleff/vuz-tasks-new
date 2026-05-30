const NeutralFullPet = () => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      fill="none"
    >
      {/* Хвост */}
      <ellipse
        cx="50"
        cy="88"
        rx="10"
        ry="5.5"
        fill="#5A8FBF"
      />

      {/* Уши */}
      <ellipse
        cx="24"
        cy="24"
        rx="8"
        ry="12"
        transform="rotate(-25 24 24)"
        fill="#5A8FBF"
      />

      <ellipse
        cx="76"
        cy="24"
        rx="8"
        ry="12"
        transform="rotate(25 76 24)"
        fill="#5A8FBF"
      />

      {/* Внутри ушей */}
      <ellipse
        cx="24"
        cy="24"
        rx="4"
        ry="7"
        transform="rotate(-25 24 24)"
        fill="#B5D4F4"
      />

      <ellipse
        cx="76"
        cy="24"
        rx="4"
        ry="7"
        transform="rotate(25 76 24)"
        fill="#B5D4F4"
      />

      {/* Голова */}
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="#85B7EB"
      />

      {/* Блик */}
      <ellipse
        cx="40"
        cy="35"
        rx="12"
        ry="8"
        transform="rotate(-25 40 35)"
        fill="rgba(255,255,255,0.15)"
      />

      {/* Глаза */}
      <circle
        cx="38"
        cy="43"
        r="5"
        fill="#0C447C"
      />

      <circle
        cx="62"
        cy="43"
        r="5"
        fill="#0C447C"
      />

      {/* Блики */}
      <circle
        cx="40"
        cy="41"
        r="1.6"
        fill="rgba(255,255,255,0.7)"
      />

      <circle
        cx="64"
        cy="41"
        r="1.6"
        fill="rgba(255,255,255,0.7)"
      />

      {/* Рот */}
      <line
        x1="40"
        y1="60"
        x2="60"
        y2="60"
        stroke="#0C447C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default NeutralFullPet;