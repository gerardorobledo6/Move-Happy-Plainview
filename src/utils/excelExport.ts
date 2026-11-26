
import * as XLSX from 'xlsx';
import client from '../api/client';
import { format } from 'date-fns';
import { APP_NAME } from "./constants.ts";

// Read date-only values without applying a timezone conversion
const formatExcelDate = (value: string | Date | null | undefined) => {
    if (!value) return '';

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    return format(new Date(value), 'yyyy-MM-dd');
};

export const exportToExcel = async () => {
    try {
        const res = await client.get('/lanes');
        const lanes = res.data;

        const rows: any[] = [];

        lanes.forEach((lane: any) => {
            lane.cards.forEach((card: any) => {
                rows.push({
                    'Title': card.title,
                    'Order Number': card.orderNumber ? String(card.orderNumber) : '',
                    'Assigned User': card.assignedUsers.map((u: any) => u.name).join(', '),
                    'Priority': card.priority,
                    'Status': card.status,
                    'Pickup Date': formatExcelDate(card.pickupDate),
                    'Due Date': formatExcelDate(card.plannedFinish),
                    'Created Date': formatExcelDate(card.createdAt),
                    'Notes': card.description?.replace(/<[^>]+>/g, '') || '',
                    'Lane': lane.title,
                    'Card ID': card.headerId,
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Auto-size columns
        if (rows.length > 0) {
            const colWidths = Object.keys(rows[0]).map(key => {
                const maxLength = rows.reduce((max, row) => {
                    const val = row[key] ? String(row[key]) : '';
                    return Math.max(max, val.length);
                }, key.length);
                return { wch: maxLength + 2 };
            });
            worksheet['!cols'] = colWidths;
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

        XLSX.writeFile(workbook, `${APP_NAME.replace(/\s+/g, '_')}_Export.xlsx`);
    } catch (error) {
        console.error("Export failed", error);
        alert("Failed to export data");
    }
};
