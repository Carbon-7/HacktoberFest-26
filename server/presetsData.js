import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPresetBase64(filename) {
  const filePath = path.join(__dirname, '../public/assets/presets', filename);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
  return null;
}

export const PRESETS = [
  {
    id: 'medicine-amoxicillin',
    mode: 'medicine',
    title: 'Prescription & Drug Warning',
    subtitle: 'Amoxicillin 500mg Capsule Label',
    tag: 'Healthcare & Seniors',
    tagColor: 'amber',
    description: 'Tests patient safety guidance, 8-hour dosage extraction, and penicillin allergy alerts.',
    imageFilename: 'preset-medicine.png',
    getImage: () => getPresetBase64('preset-medicine.png'),
    promptHint: 'Explain how often I should take this, and what the allergy warnings are.'
  },
  {
    id: 'bill-disconnection',
    mode: 'bill',
    title: 'Urgent Disconnection Notice',
    subtitle: 'Metro Energy $348.75 Past Due',
    tag: 'Civic & Financial',
    tagColor: 'rose',
    description: 'Tests deadline extraction, late fees detection, and step-by-step citizen resolution.',
    imageFilename: 'preset-bill.png',
    getImage: () => getPresetBase64('preset-bill.png'),
    promptHint: 'How much do I have to pay right now, and what is the exact shut-off date?'
  },
  {
    id: 'label-trailmix',
    mode: 'label',
    title: 'Allergen & Nutrition Panel',
    subtitle: 'Almond & Honey Granola Bar',
    tag: 'Consumer Protection',
    tagColor: 'green',
    description: 'Tests allergen identification (almonds, dairy, soy) and facility cross-contamination warning.',
    imageFilename: 'preset-label.png',
    getImage: () => getPresetBase64('preset-label.png'),
    promptHint: 'Can someone with a peanut or dairy allergy eat this safely?'
  }
];
