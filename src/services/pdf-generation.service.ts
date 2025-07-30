import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root'
})

export class PdfGenerationService {
    async generateListinoPdf(productName: string) {
        const div = document.getElementById('listino-pdf-template');

        if (!div) {
            return;
        }

        // Ensure all images are loaded before capturing
        const images = Array.from(div.getElementsByTagName('img'));
        await Promise.all(
            images.map(img => {
                if (img.complete) {
                    return Promise.resolve();
                }
                return new Promise(resolve => {
                    img.onload = img.onerror = () => resolve(null);
                });
            })
        );

        const canvas = await html2canvas(div, { scale: 2, useCORS: true });
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
        doc.save(`pdfDocument_${productName}.pdf`);
    };

    // async generateListinoPdf(productName: string) {
    //     const div = document.getElementById('listino-pdf-template');

    //     const options = { background: 'white', height: 845, width: 595 };

    //     await domtoimage.toPng(div!, options).then((dataUrl) => {
    //         //Initialize JSPDF
    //         const doc = new jsPDF('p', 'mm', 'a4');
    //         const pageWidth = doc.internal.pageSize.getWidth();
    //         const pageHeight = doc.internal.pageSize.getHeight();

    //         //Add image Url to PDF
    //         doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight);
    //         doc.save(`pdfDocument_${productName}.pdf`);
    //     });
    // }


    getFilename(productName: string): string {
        const timestamp = new Date().toISOString().slice(0, 10);
        const cleanName = productName.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `Listino_${cleanName}_${timestamp}.pdf`;
    }
}
