interface ConversionMap {
  [key: string]: number;
}

const lengthConversions: ConversionMap = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344
};

const weightConversions: ConversionMap = {
  mg: 0.000001,
  g: 0.001,
  kg: 1,
  oz: 0.0283495,
  lb: 0.453592,
  t: 1000
};

const temperatureConversions = {
  celsiusToFahrenheit: (c: number) => (c * 9/5) + 32,
  fahrenheitToCelsius: (f: number) => (f - 32) * 5/9,
  celsiusToKelvin: (c: number) => c + 273.15,
  kelvinToCelsius: (k: number) => k - 273.15
};

export function convertLength(value: number, from: string, to: string): number {
  if (!lengthConversions[from] || !lengthConversions[to]) {
    throw new Error(`Unknown length unit: ${from} or ${to}`);
  }
  const inMeters = value * lengthConversions[from];
  return inMeters / lengthConversions[to];
}

export function convertWeight(value: number, from: string, to: string): number {
  if (!weightConversions[from] || !weightConversions[to]) {
    throw new Error(`Unknown weight unit: ${from} or ${to}`);
  }
  const inKg = value * weightConversions[from];
  return inKg / weightConversions[to];
}

export function convertTemperature(value: number, from: string, to: string): number {
  const key = `${from}To${to.charAt(0).toUpperCase()}${to.slice(1)}` as keyof typeof temperatureConversions;
  const converter = temperatureConversions[key] as ((v: number) => number) | undefined;
  if (!converter) {
    throw new Error(`Unknown temperature conversion: ${from} to ${to}`);
  }
  return converter(value);
}

export const unitTools = [
  {
    name: 'convert_length',
    description: 'Convert between length units (mm, cm, m, km, in, ft, yd, mi)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        value: { type: 'number', description: 'Value to convert' },
        from: { type: 'string', description: 'From unit (mm, cm, m, km, in, ft, yd, mi)' },
        to: { type: 'string', description: 'To unit' }
      },
      required: ['value', 'from', 'to']
    }
  },
  {
    name: 'convert_weight',
    description: 'Convert between weight units (mg, g, kg, oz, lb, t)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        value: { type: 'number', description: 'Value to convert' },
        from: { type: 'string', description: 'From unit (mg, g, kg, oz, lb, t)' },
        to: { type: 'string', description: 'To unit' }
      },
      required: ['value', 'from', 'to']
    }
  },
  {
    name: 'convert_temperature',
    description: 'Convert between temperature units (celsius, fahrenheit, kelvin)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        value: { type: 'number', description: 'Value to convert' },
        from: { type: 'string', description: 'From unit (celsius, fahrenheit, kelvin)' },
        to: { type: 'string', description: 'To unit' }
      },
      required: ['value', 'from', 'to']
    }
  }
];

export async function handleUnitTool(toolName: string, args: Record<string, string | number>): Promise<string> {
  try {
    const value = typeof args.value === 'number' ? args.value : parseFloat(args.value as string);
    const from = args.from as string;
    const to = args.to as string;

    let result: number;
    switch (toolName) {
      case 'convert_length':
        result = convertLength(value, from, to);
        break;
      case 'convert_weight':
        result = convertWeight(value, from, to);
        break;
      case 'convert_temperature':
        result = convertTemperature(value, from, to);
        break;
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return JSON.stringify({ value: result, from, to });
  } catch (error) {
    throw new Error(`Unit conversion error: ${(error as Error).message}`);
  }
}
