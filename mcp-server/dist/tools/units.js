const lengthConversions = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344
};
const weightConversions = {
    mg: 0.000001,
    g: 0.001,
    kg: 1,
    oz: 0.0283495,
    lb: 0.453592,
    t: 1000
};
const temperatureConversions = {
    celsiusToFahrenheit: (c) => (c * 9 / 5) + 32,
    fahrenheitToCelsius: (f) => (f - 32) * 5 / 9,
    celsiusToKelvin: (c) => c + 273.15,
    kelvinToCelsius: (k) => k - 273.15
};
export function convertLength(value, from, to) {
    if (!lengthConversions[from] || !lengthConversions[to]) {
        throw new Error(`Unknown length unit: ${from} or ${to}`);
    }
    const inMeters = value * lengthConversions[from];
    return inMeters / lengthConversions[to];
}
export function convertWeight(value, from, to) {
    if (!weightConversions[from] || !weightConversions[to]) {
        throw new Error(`Unknown weight unit: ${from} or ${to}`);
    }
    const inKg = value * weightConversions[from];
    return inKg / weightConversions[to];
}
export function convertTemperature(value, from, to) {
    const key = `${from}To${to.charAt(0).toUpperCase()}${to.slice(1)}`;
    const converter = temperatureConversions[key];
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
            type: 'object',
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
            type: 'object',
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
            type: 'object',
            properties: {
                value: { type: 'number', description: 'Value to convert' },
                from: { type: 'string', description: 'From unit (celsius, fahrenheit, kelvin)' },
                to: { type: 'string', description: 'To unit' }
            },
            required: ['value', 'from', 'to']
        }
    }
];
export async function handleUnitTool(toolName, args) {
    try {
        const value = typeof args.value === 'number' ? args.value : parseFloat(args.value);
        const from = args.from;
        const to = args.to;
        let result;
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
    }
    catch (error) {
        throw new Error(`Unit conversion error: ${error.message}`);
    }
}
//# sourceMappingURL=units.js.map