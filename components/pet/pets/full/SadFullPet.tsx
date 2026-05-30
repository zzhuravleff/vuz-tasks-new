const SadFullPet = () => {
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
        fill="#C07810"
      />

      {/* Уши */}
      <ellipse
        cx="24"
        cy="28"
        rx="8"
        ry="12"
        transform="rotate(-35 24 28)"
        fill="#C07810"
      />

      <ellipse
        cx="76"
        cy="28"
        rx="8"
        ry="12"
        transform="rotate(35 76 28)"
        fill="#C07810"
      />

      {/* Внутри ушей */}
      <ellipse
        cx="24"
        cy="28"
        rx="4"
        ry="7"
        transform="rotate(-35 24 28)"
        fill="#FAC775"
      />

      <ellipse
        cx="76"
        cy="28"
        rx="4"
        ry="7"
        transform="rotate(35 76 28)"
        fill="#FAC775"
      />

      {/* Голова */}
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="#EF9F27"
      />

      {/* Блик */}
      <ellipse
        cx="40"
        cy="35"
        rx="12"
        ry="8"
        transform="rotate(-25 40 35)"
        fill="rgba(255,255,255,0.12)"
      />

      {/* Брови */}
      <path
        d="M28 34 L40 38"
        stroke="#633806"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M72 34 L60 38"
        stroke="#633806"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Глаза */}
      <ellipse
        cx="38"
        cy="46"
        rx="5"
        ry="4.5"
        fill="#633806"
      />

      <ellipse
        cx="62"
        cy="46"
        rx="5"
        ry="4.5"
        fill="#633806"
      />

      {/* Блики */}
      <circle
        cx="40"
        cy="44"
        r="1.5"
        fill="rgba(255,255,255,0.6)"
      />

      <circle
        cx="64"
        cy="44"
        r="1.5"
        fill="rgba(255,255,255,0.6)"
      />

      {/* Слёзы */}
      <ellipse
        cx="31"
        cy="58"
        rx="2"
        ry="3.5"
        fill="#85B7EB"
      />

      <ellipse
        cx="69"
        cy="58"
        rx="2"
        ry="3.5"
        fill="#85B7EB"
      />

      {/* Грустный рот */}
      <path
        d="M40 68 Q50 56 60 68"
        stroke="#633806"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default SadFullPet;