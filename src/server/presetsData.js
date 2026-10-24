import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPresetBase64(filename) {
  const filePath = path.join(__dirname, '../../public/assets/presets', filename);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
  return null;
}

export const PRESETS = [
  {
    id: 'medicine-amoxicillin',
    mode: 'health',
    title: 'Prescription & Drug Warning',
    subtitle: 'Amoxicillin 500mg Capsule Label',
    tag: 'Health & Rx',
    tagColor: 'amber',
    description: 'Tests patient safety guidance, 8-hour dosage extraction, and penicillin allergy alerts.',
    imageFilename: 'preset-medicine.png',
    getImage: () => getPresetBase64('preset-medicine.png'),
    promptHint: 'Explain how often I should take this, and what the allergy warnings are.'
  },
  {
    id: 'contract-employment',
    mode: 'legal',
    title: 'HR Employment Contract Trap',
    subtitle: 'Apex Global Senior Architect Agreement',
    tag: 'Legal & HR Protection',
    tagColor: 'purple',
    description: 'Catches hidden overtime without pay, 24-month bonus clawbacks, non-competes, and IP claims on private projects.',
    imageFilename: 'preset-contract.png',
    getImage: () => getPresetBase64('preset-contract.png'),
    promptHint: 'Scan for any hidden clauses regarding unpaid weekend work, bonus clawbacks, or restrictive non-competes.'
  },
  {
    id: 'bill-disconnection',
    mode: 'finance',
    title: 'Urgent Disconnection Notice',
    subtitle: 'Metro Energy $348.75 Past Due',
    tag: 'Finance & Bills',
    tagColor: 'rose',
    description: 'Tests deadline extraction, late fees detection, and step-by-step citizen resolution.',
    imageFilename: 'preset-bill.png',
    getImage: () => getPresetBase64('preset-bill.png'),
    promptHint: 'How much do I have to pay right now, and what is the exact shut-off date?'
  },
  {
    id: 'code-architecture',
    mode: 'developer',
    title: 'Cloud Architecture & Traceback',
    subtitle: 'Production Gateway 504 Timeout & Redis Pool',
    tag: 'Developer & Code',
    tagColor: 'blue',
    description: 'Analyzes distributed latency bottleneck, connection pool exhaustion, and outputs architectural Mermaid diagrams.',
    imageFilename: 'preset-code.png',
    getImage: () => getPresetBase64('preset-code.png'),
    promptHint: 'Diagnose what is causing the 504 Gateway Timeout and suggest concrete code refactoring steps.'
  },
  {
    id: 'tutor-physics',
    mode: 'tutor',
    title: 'Physics & Kinematics Derivation',
    subtitle: 'AP Physics C: 2D Projectile Motion',
    tag: 'Academic Tutor',
    tagColor: 'indigo',
    description: 'Step-by-step calculus formula derivation, flight time calculation, and graphical trajectory explanations.',
    imageFilename: 'preset-tutor.png',
    getImage: () => getPresetBase64('preset-tutor.png'),
    promptHint: 'Break down how to solve for maximum height and range step-by-step in 5th-grade terms with a diagram.'
  },
  {
    id: 'transit-boarding',
    mode: 'guide',
    title: 'Flight Pass & Transit Connection',
    subtitle: 'International SFO -> Tokyo HND Transfer',
    tag: 'Trip & Transit',
    tagColor: 'cyan',
    description: 'Warns of 75-minute minimum inter-terminal transfer, baggage re-check rules, gate closure deadlines, and customs QR.',
    imageFilename: 'preset-transit.png',
    getImage: () => getPresetBase64('preset-transit.png'),
    promptHint: 'What are the critical connection deadlines, terminal transfer steps, and baggage restrictions?'
  },
  {
    id: 'stocks-nvst',
    mode: 'stocks',
    title: 'Stocks Candlestick & Q3 Earnings',
    subtitle: 'Novasight Cloud (NVST) Guidance & Chart',
    tag: 'Stocks & Markets',
    tagColor: 'emerald',
    description: 'Interprets 90-day candlestick resistance levels, revenue beat vs guidance decelerations, and balance sheet health.',
    imageFilename: 'preset-stocks.png',
    getImage: () => getPresetBase64('preset-stocks.png'),
    promptHint: 'What are the key technical resistance zones and what guidance risks should a retail investor watch?'
  },
  {
    id: 'label-trailmix',
    mode: 'health',
    title: 'Allergen & Nutrition Panel',
    subtitle: 'Almond & Honey Granola Bar',
    tag: 'Food & Allergen Safety',
    tagColor: 'green',
    description: 'Tests allergen identification (almonds, dairy, soy) and facility cross-contamination warnings.',
    imageFilename: 'preset-label.png',
    getImage: () => getPresetBase64('preset-label.png'),
    promptHint: 'Can someone with a peanut, soy, or dairy allergy eat this safely?'
  }
];
