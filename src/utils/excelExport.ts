
import * as XLSX from 'xlsx';
import client from '../api/client';
import { APP_NAME } from "./constants.ts";

// Convert dates to real Excel date serial numbers
const formatExcelDate = (value: string | Date | null | undefined) => {
    if (!value) return '';

    let year: number;
    let month: number;
    let day: number;

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        [year, month, day] = value.slice(0, 10).split('-').map(Number);
    } else {
        const date = new Date(value);
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
    }

    // Excel date serial number, preserving the calendar date
    return Date.UTC(year, month - 1, day) / 86400000 + 25569;
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

        // Apply real Excel date formatting to date columns
        const dateColumnIndexes = [5, 6, 7];

        for (let row = 1; row <= rows.length; row++) {
            dateColumnIndexes.forEach(col => {
                const cellAddress = XLSX.utils.encode_cell({
                    r: row,
                    c: col
                });

                if (worksheet[cellAddress]) {
                    worksheet[cellAddress].z = 'mm/dd/yyyy';
                }
            });
        }

        // Auto-size columns
        if (rows.length > 0) {
            const colWidths = Object.keys(rows[0]).map(key => {
                const maxLength = rows.reduce((max, row) => {
                    const val = row[key] ? String(row[key]) : '';
                    return Math.max(max, val.length);
                }, key.length);
                return { wch: Math.max(maxLength + 2, 13) };
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
