import * as React from 'react';
import { Input } from '@/components/ui/input';

type FormattedNumberInputProps = Omit<
    React.ComponentProps<typeof Input>,
    'value' | 'onChange' | 'min' | 'max'
> & {
    value: number | string | null | undefined;
    onValueChange: (value: number) => void;
    allowDecimal?: boolean;
    min?: number;
    max?: number;
    step?: number; // Tambahan opsi step (bawaan 1)
};

function formatNumber(value: number | string | null | undefined, allowDecimal = false) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const raw = String(value).replace(/[^\d,.-]/g, '');

    if (allowDecimal) {
        const normalized = raw.replace(',', '.');
        const [integerPart, decimalPart] = normalized.split('.');

        const formattedInteger = integerPart
            ? Number(integerPart).toLocaleString('id-ID')
            : '';

        if (decimalPart !== undefined) {
            return `${formattedInteger},${decimalPart}`;
        }

        return formattedInteger;
    }

    const number = Number(raw.replace(/\D/g, ''));

    if (Number.isNaN(number)) {
        return '';
    }

    return number.toLocaleString('id-ID');
}

function parseNumber(value: string, allowDecimal = false) {
    if (!value) return 0;

    if (allowDecimal) {
        const normalized = value
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.]/g, '');

        const number = Number(normalized);
        return Number.isNaN(number) ? 0 : number;
    }

    const number = Number(value.replace(/\D/g, ''));
    return Number.isNaN(number) ? 0 : number;
}

export function FormattedNumberInput({
    value,
    onValueChange,
    allowDecimal = true,
    min,
    max,
    step = 1,
    ...props
}: FormattedNumberInputProps) {
    const [displayValue, setDisplayValue] = React.useState(() => {
        return formatNumber(value, allowDecimal);
    });

    // Sinkronisasi saat properti 'value' dari luar berubah (misal reset form)
    React.useEffect(() => {
        const formatted = formatNumber(value, allowDecimal);
        // Hanya update jika nilai mentah-nya berbeda agar tidak merusak ketikan desimal yang sedang aktif
        if (parseNumber(formatted, allowDecimal) !== parseNumber(displayValue, allowDecimal)) {
            setDisplayValue(formatted);
        }
    }, [value, allowDecimal]);

    // Fungsi pusat untuk validasi min/max
    const clampValue = (numericValue: number): number => {
        let validated = numericValue;
        if (max !== undefined && validated > max) validated = max;
        if (min !== undefined && validated < min) validated = min;
        return allowDecimal ? validated : Math.floor(validated);
    };

    // Handler saat mengetik manual
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;

        // Jika input kosong, kembalikan nilai ke 0
        if (inputValue === '') {
            onValueChange(0);
            setDisplayValue('');
            return;
        }

        // Jalur khusus desimal: jika user mengetik koma di ujung, jangan langsung di-format tulisan angka-nya
        if (allowDecimal && (inputValue.endsWith(',') || inputValue.endsWith('.'))) {
            const parsed = parseNumber(inputValue, true);
            const clamped = clampValue(parsed);
            
            // Jika angka yang diketik melampaui max, langsung kunci ke nilai max
            if (parsed !== clamped) {
                onValueChange(clamped);
                setDisplayValue(formatNumber(clamped, true));
            } else {
                // Jika masih aman, biarkan user melanjutkan ketikan komanya
                setDisplayValue(inputValue);
                onValueChange(clamped);
            }
            return;
        }

        // Jalur normal untuk angka biasa / desimal utuh (misal: 29,7)
        const parsed = parseNumber(inputValue, allowDecimal);
        const clamped = clampValue(parsed);

        onValueChange(clamped);
        
        // Jika user mengetik angka desimal yang berakhiran 0 (misal: 29,70), pertahankan angka 0 tersebut saat mengetik
        if (allowDecimal && inputValue.includes(',') && inputValue.endsWith('0')) {
            setDisplayValue(inputValue);
        } else {
            setDisplayValue(formatNumber(clamped, allowDecimal));
        }
    };

    // Handler untuk tombol Arrow Up dan Arrow Down
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const currentValue = parseNumber(displayValue, allowDecimal);

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            const nextValue = clampValue(currentValue + step);
            onValueChange(nextValue);
            setDisplayValue(formatNumber(nextValue, allowDecimal));
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            const nextValue = clampValue(currentValue - step);
            onValueChange(nextValue);
            setDisplayValue(formatNumber(nextValue, allowDecimal));
        }
    };

    return (
        <Input
            {...props}
            inputMode={allowDecimal ? 'decimal' : 'numeric'}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
        />
    );
}

export default FormattedNumberInput;