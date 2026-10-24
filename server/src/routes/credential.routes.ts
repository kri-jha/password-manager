import { Router } from 'express';
import { credentialController } from '../controllers/credential.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  createCredentialSchema,
  updateCredentialSchema,
  credentialIdParamSchema,
  listCredentialsQuerySchema
} from '../validators/credential.schema.js';

const router = Router();

// All credential routes require authentication
router.use(authenticate);

router.get('/', validate(listCredentialsQuerySchema), credentialController.getCredentials);
router.get('/:id', validate(credentialIdParamSchema), credentialController.getCredentialById);
router.post('/', validate(createCredentialSchema), credentialController.createCredential);
router.patch('/:id', validate(updateCredentialSchema), credentialController.updateCredential);
router.delete('/:id', validate(credentialIdParamSchema), credentialController.deleteCredential);
router.post('/:id/favorite', validate(credentialIdParamSchema), credentialController.toggleFavorite);

export default router;
