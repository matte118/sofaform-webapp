import { Injectable, ComponentRef, inject } from '@angular/core';
import { ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image';

@Injectable({
    providedIn: 'root'
})

export class PdfGenerationService {
    // generateListinoPdf(productName: string) {
    //     const elementToPrint = document.getElementById('listino-pdf-template');

    //     console.log('Generating PDF for:', elementToPrint);

    //     html2canvas(elementToPrint!, { scale: 2 }).then((canvas) => {
    //         const pdf = new jsPDF();
    //         pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);

    //         pdf.setProperties({
    //             title: 'Listino Prezzi',
    //             subject: 'Listino Prezzi',
    //             author: 'SofaForm',
    //         });

    //         pdf.setFontSize(12);
    //         pdf.text('Generato da SofaForm', 14, 22);

    //         pdf.save(`Listino_Prezzi_${productName}.pdf`);
    //     });
    // }

    generateListinoPdf(productName: string) {
        const div = document.getElementById('listino-pdf-template');

        const options = { background: 'white', height: 845, width: 595 };

        domtoimage.toPng(div!, options).then((dataUrl) => {
            //Initialize JSPDF
            const doc = new jsPDF('p', 'mm', 'a4');
            //Add image Url to PDF
            doc.addImage(dataUrl, 'PNG', 0, 0, 210, 340);
            doc.save(`pdfDocument_${productName}.pdf`);
        });
    }


    getFilename(productName: string): string {
        const timestamp = new Date().toISOString().slice(0, 10);
        const cleanName = productName.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `Listino_${cleanName}_${timestamp}.pdf`;
    }
}
