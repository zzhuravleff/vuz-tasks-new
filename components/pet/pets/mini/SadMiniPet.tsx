const SadMiniPet = () => {
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
        fill="#EF9F27"
      />

      <circle
        cx="38"
        cy="42"
        r="4"
        fill="#633806"
      />

      <circle
        cx="62"
        cy="42"
        r="4"
        fill="#633806"
      />

      <path
        d="M40 66 Q50 54 60 66"
        stroke="#633806"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default SadMiniPet;