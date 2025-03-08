const express = require('express');
const cors = require('cors');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/generate-doc', async (req, res) => {
    const { nombre, ciudad, documento, marca, modelo, cilindradas, numeroMotor } = req.body;

    // Formatear el número de documento
    const documentoFormateado = documento.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Obtener la fecha actual en formato dd/mm/yyyy
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Enero es 0
    const yyyy = today.getFullYear();
    const fechaActual = `${dd}/${mm}/${yyyy}`;

    // Cargar la plantilla .docx
    const template = fs.readFileSync('./NFFAZER.docx', 'binary');
    const zip = new PizZip(template);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    // Datos para reemplazar en la plantilla
    const data = {
        // Etiquetas únicas para evitar duplicados
        fecha_1: fechaActual,
        fecha_2: fechaActual,
        fecha_3: fechaActual,
        fecha_4: fechaActual,
        fecha_5: fechaActual,
        nombre_1: nombre,
        nombre_2: nombre,
        ciudad_1: ciudad,
        ciudad_2: ciudad,
        documento_1: documentoFormateado,
        documento_2: documentoFormateado,
        marca,
        modelo,
        cilindradas,
        numeroMotor,
    };

    try {
        // Renderizar el documento con los datos
        doc.render(data);
    } catch (error) {
        console.error('Error al renderizar el documento:', error);
        return res.status(500).send('Error al renderizar el documento');
    }

    // Generar el documento modificado
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    const fileName = `NF_${marca}_${modelo}.docx`;

    // Guardar el archivo temporalmente
    fs.writeFileSync(fileName, buffer);

    // Enviar el archivo al cliente
    res.download(fileName, (err) => {
        if (err) {
            console.error('Error al descargar el documento:', err);
            res.status(500).send('Error al descargar el documento');
        }

        // Opcional: eliminar el archivo después de enviarlo
        fs.unlinkSync(fileName);
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});