"use client";

import { memo } from "react";
import { PetState } from "@/lib/petUtils";

// MINI
import HappyMiniPet from "./pets/mini/HappyMiniPet";
import NeutralMiniPet from "./pets/mini/NeutralMiniPet";
import SadMiniPet from "./pets/mini/SadMiniPet";
import SickMiniPet from "./pets/mini/SickMiniPet";

// FULL
import HappyFullPet from "./pets/full/HappyFullPet";
import NeutralFullPet from "./pets/full/NeutralFullPet";
import SadFullPet from "./pets/full/SadFullPet";
import SickFullPet from "./pets/full/SickFullPet";

interface PetCanvasProps {
  state: PetState;
  size?: number;
  mini?: boolean;
}

const MINI_PETS = {
  happy: HappyMiniPet,
  neutral: NeutralMiniPet,
  sad: SadMiniPet,
  sick: SickMiniPet,
};

const FULL_PETS = {
  happy: HappyFullPet,
  neutral: NeutralFullPet,
  sad: SadFullPet,
  sick: SickFullPet,
};

export const PetCanvas = memo(
  ({ state, size = 120, mini = false }: PetCanvasProps) => {
    const Pet = mini
      ? MINI_PETS[state]
      : FULL_PETS[state];

    return (
      <div
        style={{
          width: size,
          height: size,
        }}
        className="shrink-0"
      >
        <Pet />
      </div>
    );
  }
);

PetCanvas.displayName = "PetCanvas";