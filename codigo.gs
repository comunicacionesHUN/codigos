// ID de tu hoja de cálculo de Google Sheets
// Reemplaza 'TU_ID_DE_HOJA_DE_CALCULO' con el ID real de tu hoja de cálculo
const SPREADSHEET_ID = '1928025npRntzuSx_b_Rl0awK4ZhXNgFZBq8DQuiDzuw';

// ID de la carpeta de Google Drive donde se guardarán los documentos
// Reemplaza 'TU_ID_DE_CARPETA_DE_DRIVE' con el ID real de tu carpeta de Drive
const FOLDER_ID = '1p-Gsm-BbIqlqyU3dGxuFfyBxBSo49qOV';

/**
 * Sirve el archivo HTML principal cuando se accede a la aplicación web.
 * @returns {HtmlOutput} El contenido HTML de index.html.
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
      .setTitle('Registro de Pacientes')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME); // Modo de sandbox para mayor seguridad
}

/**
 * Procesa los datos del formulario enviados desde el cliente.
 * Guarda los datos en Google Sheets y los archivos en Google Drive.
 * @param {Object} formData - Objeto con los datos del formulario (excepto los archivos).
 * @param {Object} fileData - Objeto con los archivos (blobs) subidos.
 * @returns {Object} Un objeto con el estado de éxito y un mensaje.
 */
function processForm(formData, fileData) {
  try {
    Logger.log('Datos del formulario recibidos: ' + JSON.stringify(formData));
    Logger.log('Datos de archivos recibidos (fileData): ' + JSON.stringify(Object.keys(fileData)));
    
    // Verificar si los archivos son Blobs válidos
    if (fileData.ccDoc) {
      Logger.log('ccDoc existe. Tipo: ' + typeof fileData.ccDoc + ', Nombre: ' + (fileData.ccDoc.getName ? fileData.ccDoc.getName() : 'N/A'));
    } else {
      Logger.log('ccDoc no adjunto o no válido.');
    }
    if (fileData.policyDoc) {
      Logger.log('policyDoc existe. Tipo: ' + typeof fileData.policyDoc + ', Nombre: ' + (fileData.policyDoc.getName ? fileData.policyDoc.getName() : 'N/A'));
    } else {
      Logger.log('policyDoc no adjunto o no válido.');
    }
    if (fileData.medicalOrderDoc) {
      Logger.log('medicalOrderDoc existe. Tipo: ' + typeof fileData.medicalOrderDoc + ', Nombre: ' + (fileData.medicalOrderDoc.getName ? fileData.medicalOrderDoc.getName() : 'N/A'));
    } else {
      Logger.log('medicalOrderDoc no adjunto o no válido.');
    }


    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Registros'); // Asegúrate de que el nombre de la hoja sea 'Registros'

    if (!sheet) {
      throw new Error('La hoja "Registros" no se encontró en el libro de cálculo.');
    }

    // Obtener la carpeta de Drive
    const driveFolder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('Carpeta de Drive obtenida: ' + driveFolder.getName());

    // Preparar los enlaces a los documentos
    let ccLink = '';
    let policyLink = '';
    let medicalOrderLink = '';

    // Subir archivos y obtener sus enlaces
    if (fileData.ccDoc && fileData.ccDoc.getName()) { // Asegúrate de que es un Blob válido
      const ccFile = driveFolder.createFile(fileData.ccDoc);
      ccLink = ccFile.getUrl();
      Logger.log('Archivo CC subido: ' + ccLink);
    }
    if (fileData.policyDoc && fileData.policyDoc.getName()) { // Asegúrate de que es un Blob válido
      const policyFile = driveFolder.createFile(fileData.policyDoc);
      policyLink = policyFile.getUrl();
      Logger.log('Archivo Póliza subido: ' + policyLink);
    }
    if (fileData.medicalOrderDoc && fileData.medicalOrderDoc.getName()) { // Asegúrate de que es un Blob válido
      const medicalOrderFile = driveFolder.createFile(fileData.medicalOrderDoc);
      medicalOrderLink = medicalOrderFile.getUrl();
      Logger.log('Archivo Orden Médica subido: ' + medicalOrderLink);
    }

    // Calcular la edad
    let age = '';
    if (formData.dob) {
      const dob = new Date(formData.dob);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // Determinar la EPS final
    const eps = formData.eps === 'Otra' ? formData.otherEps : formData.eps;

    // Obtener la fecha y hora actual para el registro
    const registrationDate = new Date();

    // Añadir una nueva fila a la hoja de cálculo
    sheet.appendRow([
      registrationDate,
      formData.patientType,
      formData.fullName,
      formData.dob,
      age,
      eps,
      ccLink,
      policyLink,
      medicalOrderLink
    ]);
    Logger.log('Fila añadida a la hoja de cálculo.');

    return { success: true, message: 'Registro guardado exitosamente!' };

  } catch (error) {
    Logger.log('Error en processForm: ' + error.message);
    return { success: false, message: 'Error al guardar el registro: ' + error.message };
  }
}

/**
 * Incluye un archivo HTML en otro.
 * Usado por HtmlService.createTemplateFromFile().
 * @param {string} filename - El nombre del archivo HTML a incluir.
 * @returns {string} El contenido del archivo HTML.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
