import * as XLSX from 'xlsx';
import client from '../api/client';
import { format } from 'date-fns';
import { APP_NAME } from "./constants.ts";

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
                    'Pickup Date': card.pickupDate ? format(new Date(card.pickupDate), 'yyyy-MM-dd') : '',
                    'Due Date': card.plannedFinish ? format(new Date(card.plannedFinish), 'yyyy-MM-dd') : '',
                    'Created Date': card.createdAt ? format(new Date(card.createdAt), 'yyyy-MM-dd') : '',
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
