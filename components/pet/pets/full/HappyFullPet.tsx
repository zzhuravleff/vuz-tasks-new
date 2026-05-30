const HappyFullPet = () => {
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
        rx="12"
        ry="6"
        fill="#7DB83A"
      />

      {/* Уши */}
      <ellipse
        cx="24"
        cy="24"
        rx="8"
        ry="12"
        transform="rotate(-25 24 24)"
        fill="#7DB83A"
      />

      <ellipse
        cx="76"
        cy="24"
        rx="8"
        ry="12"
        transform="rotate(25 76 24)"
        fill="#7DB83A"
      />

      {/* Внутри ушей */}
      <ellipse
        cx="24"
        cy="24"
        rx="4"
        ry="7"
        transform="rotate(-25 24 24)"
        fill="#C0DD97"
      />

      <ellipse
        cx="76"
        cy="24"
        rx="4"
        ry="7"
        transform="rotate(25 76 24)"
        fill="#C0DD97"
      />

      {/* Голова */}
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="#97C459"
      />

      {/* Блик */}
      <ellipse
        cx="40"
        cy="35"
        rx="12"
        ry="8"
        transform="rotate(-25 40 35)"
        fill="rgba(255,255,255,0.18)"
      />

      {/* Глаза */}
      <circle
        cx="38"
        cy="43"
        r="5.5"
        fill="#2C5A0E"
      />

      <circle
        cx="62"
        cy="43"
        r="5.5"
        fill="#2C5A0E"
      />

      {/* Блики глаз */}
      <circle
        cx="40"
        cy="41"
        r="1.8"
        fill="rgba(255,255,255,0.7)"
      />

      <circle
        cx="64"
        cy="41"
        r="1.8"
        fill="rgba(255,255,255,0.7)"
      />

      {/* Щёки */}
      <ellipse
        cx="30"
        cy="54"
        rx="7"
        ry="4"
        fill="rgba(255,150,100,0.25)"
      />

      <ellipse
        cx="70"
        cy="54"
        rx="7"
        ry="4"
        fill="rgba(255,150,100,0.25)"
      />

      {/* Улыбка */}
      <path
        d="M38 54 Q50 66 62 54"
        stroke="#2C5A0E"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Звёзды */}
      <circle
        cx="10"
        cy="30"
        r="3"
        fill="#FAC775"
      />

      <circle
        cx="90"
        cy="35"
        r="3"
        fill="#FAC775"
      />

      <circle
        cx="84"
        cy="58"
        r="3"
        fill="#FAC775"
      />
    </svg>
  );
};

export default HappyFullPet;