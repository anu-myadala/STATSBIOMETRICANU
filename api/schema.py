from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RecoveryRequest:
    total_steps: float
    very_active_minutes: float
    resting_heart_rate: float
    sleep_duration_min: float
    protein_g: float
    carbs_g: float
    fat_g: float
    pca_1: float
    pca_2: float
    pca_3: float

    def to_feature_vector(self) -> list[float]:
        return [
            self.total_steps,
            self.very_active_minutes,
            self.resting_heart_rate,
            self.sleep_duration_min,
            self.protein_g,
            self.carbs_g,
            self.fat_g,
            self.pca_1,
            self.pca_2,
            self.pca_3,
        ]
