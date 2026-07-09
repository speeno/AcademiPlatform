import { SetMetadata } from '@nestjs/common';

export const TRAINING_PERMISSION_KEY = 'requireTrainingPermission';
export const RequireTrainingPermission = () =>
  SetMetadata(TRAINING_PERMISSION_KEY, true);
