const NeutralMiniPet = () => {
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
        fill="#85B7EB"
      />

      <circle
        cx="38"
        cy="42"
        r="4"
        fill="#0C447C"
      />

      <circle
        cx="62"
        cy="42"
        r="4"
        fill="#0C447C"
      />

      <line
        x1="40"
        y1="60"
        x2="60"
        y2="60"
        stroke="#0C447C"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default NeutralMiniPet;