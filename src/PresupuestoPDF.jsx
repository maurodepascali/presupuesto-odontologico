import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Importa la extensión autoTable
import html2canvas from 'html2canvas';

export const generatePDF = (selectedServices, totalPrice, patientName, observaciones, selectedTratamiento, subtitle) => {
    const date = new Date();
    const getMonthName = (month) => {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return monthNames[month];
    };
    const formattedDate = `Buenos Aires, ${date.getDate()} de ${getMonthName(date.getMonth())} de ${date.getFullYear()}`;

    const pdf = new jsPDF();

    //fecha lado derecho
    pdf.setFontSize(12);
    pdf.text(formattedDate, 130, 10);

    pdf.setFontSize(18);
    pdf.setFont('Lato', 'bold');
    pdf.text("PRESUPUESTO ODONTOLÓGICO", 105, 30, null, null, 'center');

    // Agregar el subtitulo
    pdf.setFontSize(14);
    pdf.text(`${subtitle}`, 90, 38);

    // Agregar el nombre del paciente
    pdf.setFontSize(14);
    pdf.text(`Paciente: ${patientName}`, 14, 55);

    //tabla de presupuesto
    const rows = selectedServices.map(service => [service.servicio, service.cantidad, `$${service.precio}`, `$${service.precio * service.cantidad}`]);

    const headStyles = {
        fillColor: '#7FFFD4', // Color de fondo del encabezado
        textColor: '#000000', // Color de texto negro
        fontStyle: 'bold' // Texto en negrita
    };

    // Definir los estilos para cada columna
    const columnStyles = {
    0: {}, // Estilo en negrita para la primera columna (TRATAMIENTO)
    1: {}, // No se aplican estilos especiales para la segunda columna (CANTIDAD)
    2: {cellWidth: 35 }, // No se aplican estilos especiales para la tercera columna (PRECIO UNITARIO)
    3: {cellWidth: 20}  // No se aplican estilos especiales para la cuarta columna (TOTAL)
    };

    pdf.autoTable({ 
        startY: 60, 
        head: [['TRATAMIENTO', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL']], 
        body: rows, 
        headStyles: headStyles,
        columnStyles: columnStyles
    });

    // Agregar el total
    pdf.setFontSize(12);
    pdf.text(`Total: $${totalPrice}`, 158, pdf.autoTable.previous.finalY + 10);

    // Agregar observaciones
const textWidth = 190; // Ancho deseado del área de texto
const letterSpacing = 0; // Espaciado entre letras deseado
const lineHeight = 6; // Altura de línea deseada
const observacionesTratamiento = observaciones[selectedTratamiento];
let currentY = pdf.autoTable.previous.finalY + 40;

pdf.text("OBSERVACIONES:", 10, currentY, { lineHeight: lineHeight, letterSpacing: letterSpacing, fontWeight: "normal" }); // Agregar texto estático
currentY += lineHeight + 5; // Ajustar la posición Y para las observaciones
pdf.setFont('Lato', 'normal');
observacionesTratamiento.forEach(observacion => {
    if (typeof observacion === 'string') {
        const splitText = pdf.splitTextToSize(observacion, textWidth);
        pdf.text(splitText, 10, currentY, { lineHeight: lineHeight, letterSpacing: letterSpacing, fontWeight: "normal" }); // Ajustar el espaciado entre letras
        currentY += (splitText.length * lineHeight) + 0; // Ajustar la posición Y para la próxima observación
    }
});


    // Guardar el PDF
    pdf.save(`Presupuesto_${formattedDate}.pdf`);
};
