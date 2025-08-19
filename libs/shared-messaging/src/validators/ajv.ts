import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { XRaySchemaUnion } from '../schemas/xray.schema';

const ajv = new Ajv({ allErrors: true, strict: true, removeAdditional: true });
addFormats(ajv);

export const validateXRay = ajv.compile(XRaySchemaUnion);
