import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';
import { generatePDF } from './PresupuestoPDF';
import Observaciones from './Observaciones';
import { styled } from '@mui/material/styles';
import { Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import Button from '@mui/material/Button';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CancelIcon from '@mui/icons-material/Cancel';

function App() {

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({ servicio: '', cantidad: 0, precio: 0 });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedServiceIdToDelete, setSelectedServiceIdToDelete] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedService, setEditedService] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [serviceIdToDelete, setServiceIdToDelete] = useState(null);
  const [subtitle, setSubtitle] = useState('');
  const [savePDFConfirmationOpen, setSavePDFConfirmationOpen] = useState(false);
  const [selectedTratamiento, setSelectedTratamiento] = useState('');
  const [observaciones, setObservaciones] = useState({
    tratamiento1: [
      '*Una vez recibido el plan de tratamiento con su presupuesto, el paciente deberá responder dentro de las 72hs hábiles desde el momento en que se le envía dicho plan para poder empezar a llevarlo a cabo.',
      '*Al momento de aceptar el plan de tratamiento el paciente asume una responsabilidad respecto al cumplimiento en tiempo y forma de los turnos, como también de los tiempos pactados para cada tratamiento y los montos abonar.',
      '*Se le informa al paciente que dependiendo el tratamiento a realizar deberá ser abonado de forma anticipada ó en la misma sesión que es realizado dicho tratamiento.',
      '*Formas de pago: según como este presupuestado',
      '   *Dólar blue: Billete o en pesos argentinos al cambio del dia (Compra)',
      '   *Pesos argentinos, efectivo',
      '   *Se podrán abonar por transferencia bancaria solamente montos menores a $100.000 pesos argentino',
      '   *No se acepta tarjetas de debito ni crédito.',
      '*El tratamiento propuesto NO involucra Ortodoncia ni blanqueamiento dentario.',
      '*Los valores del presupuesto son actuales, los mismos pueden sufrir modificaciones. Estas modificaciones serán pactadas y acordadas entre el paciente y el profesional.',
      '*Tener en cuenta que en rehabilitaciones de mediana y alta complejidad pueden surgir modificaciones de tratamientos que no fueron previstos a pesar de que se realizó un diagnóstico clínico-radiográfico y modelos de estudios montados en articulador. En ese caso se le informará al paciente al igual que el valor del mismo.'
 ],
    tratamiento2: [
      '● Una vez recibido el plan de tratamiento con su presupuesto, el paciente deberá responder dentro de las 72hs hábiles desde el momento en que se le envía dicho plan para poder empezar a llevarlo a cabo.',
      '● Al momento de aceptar el plan de tratamiento el paciente asume una responsabilidad respecto al cumplimiento en tiempo y forma de los turnos, como también de los tiempos pactados para cada tratamiento y los montos abonar.',
      '● Se le informa al paciente que dependiendo el tratamiento a realizar deberá ser abonado de forma anticipada ó en la misma sesión que es realizado dicho tratamiento.',
      '● Formas de pago: según como este presupuestado',
        '▪ Dólar blue: Billete o en pesos argentinos al cambio del dia (Compra)',
        '▪ Pesos argentinos, efectivo',
        '▪ Se podrán abonar por transferencia bancaria solamente montos menores a $100.000 pesos argentino',
        '▪ No se acepta tarjetas de debito ni crédito.',
      '● El tratamiento propuesto NO involucra Ortodoncia ni blanqueamiento dentario.',
      '● Los valores del presupuesto son actuales, los mismos pueden sufrir modificaciones. Estas modificaciones serán pactadas y acordadas entre el paciente y el profesional.',
      '● Tener en cuenta que en rehabilitaciones de mediana y alta complejidad pueden surgir modificaciones de tratamientos que no fueron previstos a pesar de que se realizó un diagnóstico clínico-radiográfico y modelos de estudios montados en articulador. En ese caso se le informará al paciente al igual que el valor del mismo.'
 ],   
});

useEffect(() => {
  // Función para obtener los servicios desde Firestore al cargar el componente
  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, 'servicios'));
      const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesData);
    } catch (error) {
      console.error('Error al obtener los servicios:', error.message);
    }     
  };

  // Llama a fetchServices al montar el componente
  fetchServices();
}, []);

// Maneja el cambio en la selección de servicio desde el dropdown
const handleServiceChange = (event) => {
  const selectedId = event.target.value;
  const selectedService = services.find(service => service.id === selectedId);
  if (selectedService) {
    // Agrega el servicio seleccionado a la lista de servicios seleccionados
    if (!selectedServices.some(service => service.id === selectedService.id)) {
      setSelectedServices([...selectedServices, { ...selectedService, cantidad: 1 }]);
      // Incrementa el precio total basado en el precio del servicio seleccionado
      const totalPriceIncrement = selectedService.precio * 1;
      setTotalPrice(totalPrice + totalPriceIncrement);
    }
    event.target.selectedIndex = 0; // Reinicia el dropdown
  }
};

// Maneja el cambio en la cantidad de un servicio seleccionado
const handleQuantityChange = (event, id) => {
  const quantity = parseInt(event.target.value);
  const updatedServices = selectedServices.map(service =>
    service.id === id ? { ...service, cantidad: quantity } : service
  );
  setSelectedServices(updatedServices);
  // Recalcula el precio total basado en los servicios seleccionados
  recalculateTotalPrice(updatedServices);
};

// Recalcula el precio total basado en los servicios seleccionados
const recalculateTotalPrice = (services) => {
  const totalPrice = services.reduce((total, service) => {
    return total + (service.cantidad > 0 ? service.precio * service.cantidad : 0);
  }, 0);
  setTotalPrice(totalPrice);
};

// Maneja la adición de un nuevo servicio a Firestore
const handleAddService = async () => {
  try {
    const docRef = await addDoc(collection(db, 'servicios'), newServiceData);
    const addedService = { id: docRef.id, ...newServiceData };
    setServices([...services, addedService]);
    setSelectedServices([...selectedServices, { ...addedService, cantidad: 1 }]);
    setShowAddServiceModal(false);
    setNewServiceData({ servicio: '', cantidad: 0, precio: 0 });
    
    // Recalcula el precio total
    const totalPriceIncrement = newServiceData.precio * 1;
    setTotalPrice(totalPrice + totalPriceIncrement);
  } catch (error) {
    console.error('Error al agregar el servicio:', error.message);
  }
};

// Abre el diálogo de edición de un servicio seleccionado
const handleEditService = async (service) => {
  setEditedService(service);
  setOpenEditDialog(true);
};

// Cierra el diálogo de edición
const handleCloseEditDialog = () => {
  setOpenEditDialog(false);
};

// Guarda los cambios realizados en un servicio en Firestore
const handleEditServiceInDialog = async () => {
  try {
      const updatedServiceData = { servicio: editedService.servicio, precio: parseFloat(editedService.precio) };
      await updateDoc(doc(db, 'servicios', editedService.id), updatedServiceData);
      const updatedServices = services.map(s =>
          s.id === editedService.id ? { ...s, ...updatedServiceData } : s
      );
      setServices(updatedServices);
      const updatedSelectedServices = selectedServices.map(s =>
          s.id === editedService.id ? { ...s, ...updatedServiceData } : s
      );
      setSelectedServices(updatedSelectedServices);
      // Recalcula el precio total
      recalculateTotalPrice(updatedSelectedServices);
      setOpenEditDialog(false);
  } catch (error) {
      console.error('Error al editar el servicio:', error.message);
  }
};

// Elimina un servicio de Firestore y de la lista de servicios seleccionados
const handleDeleteServiceAndSelect = async (serviceId) => {
  try {
    // Elimina el servicio de la base de datos
    await deleteDoc(doc(db, 'servicios', serviceId));

    // Filtra los servicios seleccionados para eliminar el servicio específico
    const updatedSelectedServices = selectedServices.filter(service => service.id !== serviceId);
    setSelectedServices(updatedSelectedServices);

    // Establece el precio total en 0 si no hay servicios seleccionados
    if (updatedSelectedServices.length === 0) {
      setTotalPrice(0);
    } else {
      // Recalcula el precio total si hay servicios seleccionados
      recalculateTotalPrice(updatedSelectedServices);
    }

    // Elimina el servicio del menú (select)
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
  } catch (error) {
    console.error('Error al eliminar el servicio:', error.message);
  }
};

// Muestra el modal de confirmación para eliminar un servicio
const handleDeleteServiceConfirmation = (id) => {
  setShowDeleteConfirmation(true);
  setSelectedServiceIdToDelete(id);
};

// Elimina un servicio de la lista de servicios seleccionados
const handleDeleteService = (id) => {
  const updatedSelectedServices = selectedServices.filter(service => service.id !== id);
  setSelectedServices(updatedSelectedServices);
  setShowDeleteConfirmation(false);

  // Recalcula el precio total si hay servicios seleccionados
  recalculateTotalPrice(updatedSelectedServices);
};

// Genera y guarda un PDF basado en los servicios seleccionados y otros datos
const handleSaveAsPDF = () => {
  generatePDF(selectedServices, totalPrice, patientName, observaciones, selectedTratamiento, subtitle);
};

// Estilo personalizado para celdas de tabla
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

// Estilo personalizado para filas de tabla
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // Oculta el último borde
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

// Abre el modal de confirmación para eliminar un servicio
const handleOpenDeleteConfirmation = (serviceId) => {
  setServiceIdToDelete(serviceId);
  setDeleteConfirmationOpen(true);
};

// Cierra el modal de confirmación para eliminar un servicio
const handleCloseDeleteConfirmation = () => {
  setDeleteConfirmationOpen(false);
};

// Confirma la eliminación de un servicio
const handleConfirmDelete = () => {
  handleCloseDeleteConfirmation();
  handleDeleteServiceAndSelect(serviceIdToDelete);
};

// Abre el modal de confirmación para guardar como PDF
const handleOpenSavePDFConfirmation = () => {
  setSavePDFConfirmationOpen(true);
};

// Cierra el modal de confirmación para guardar como PDF
const handleCloseSavePDFConfirmation = () => {
  setSavePDFConfirmationOpen(false);
};

// Confirma la acción de guardar como PDF
const handleConfirmSavePDF = () => {
  handleCloseSavePDFConfirmation();
  handleSaveAsPDF();
};

// Estilo personalizado para la fila de encabezado de la tabla
const StyledTableRowHeader = styled(TableRow)(({ theme }) => ({
  backgroundColor: '#7FFFD4',
}));

// Estilo personalizado para la celda de encabezado de la tabla
const StyledTableCellHeader = styled(TableCell)(({ theme }) => ({
  color: 'black', // Cambia el color del texto del encabezado
  fontWeight:'bold'
}));

  return (
    <div className="container">
      <h1 className="titulo-presupuesto">PRESUPUESTO ODONTOLÓGICO</h1>
      <div className="input-container">
        <Box sx={{ '& > :not(style)': { m: 1 } }}>
          <FormControl variant="standard">
            <InputLabel htmlFor="subtitle">Subtítulo</InputLabel>
            <Input
              id="subtitle"
              placeholder="Ingrese un subtítulo"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
            />
          </FormControl>
        </Box>
      </div>
      <div className="input-container">
        <Box sx={{ '& > :not(style)': { m: 1 } }}>
          <FormControl variant="standard">
            <InputLabel htmlFor="patientName">Paciente</InputLabel>
            <Input
              id="patientName"
              value={patientName}
              onChange={(event) => setPatientName(event.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <AccountCircle />
                </InputAdornment>
              }
            />
          </FormControl>
        </Box>
      </div>

      <div className="actions">
      <FormControl variant="standard" sx={{ m: 1, minWidth: 250 }}>
        <InputLabel id="select-service-label">Seleccione un tratamiento</InputLabel>
        <Select
          labelId="select-service-label"
          id="select-service"
          value=""
          onChange={handleServiceChange}
          label="Seleccione un tratamiento">
          {services.map(service => (
            <MenuItem key={service.id} value={service.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft:'10px'}}>
            <span>{service.servicio}</span>
            <Button onClick={(event) => {
              event.stopPropagation();
              // Aquí llamamos a la función para eliminar el servicio del select y de la base de datos
              handleOpenDeleteConfirmation(service.id); 
            }}>
              <CancelIcon style={{marginLeft:'20px'}}/>
            </Button>
          </MenuItem>
          
          ))}
        </Select>
    </FormControl>
        <Button variant="contained" color="primary" onClick={() => setShowAddServiceModal(true)} style={{marginLeft: '10px'}}><AddIcon/></Button>
      </div>

      <Dialog
  open={deleteConfirmationOpen}
  onClose={handleCloseDeleteConfirmation}
>
  <DialogTitle>¿Estás seguro que deseas eliminar el registro?</DialogTitle>
  <DialogActions style={{margin:'10px'}}>
    <Button onClick={handleCloseDeleteConfirmation} variant="contained" color="primary">
      Cancelar
    </Button>
    <Button onClick={handleConfirmDelete} variant="contained" color="error">
      Eliminar
    </Button>
  </DialogActions>
</Dialog>

      {showAddServiceModal && (
        <Dialog open={showAddServiceModal} onClose={() => setShowAddServiceModal(false)}>
        <DialogTitle style={{fontSize:'15px', fontWeight:'bold'}}>AGREGAR TRATAMIENTO</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            id="servicio"
            label="Tratamiento"
            type="text"
            fullWidth
            value={newServiceData.servicio}
            onChange={(e) => setNewServiceData({ ...newServiceData, servicio: e.target.value })}
          />
          <TextField
            margin="dense"
            id="cantidad"
            label="Cantidad"
            type="number"
            fullWidth
            value={newServiceData.cantidad}
            onChange={(e) => setNewServiceData({ ...newServiceData, cantidad: e.target.value })}
          />
          <TextField
            margin="dense"
            id="precio"
            label="Precio"
            type="number"
            fullWidth
            value={newServiceData.precio}
            onChange={(e) => setNewServiceData({ ...newServiceData, precio: e.target.value })}
          />
        </DialogContent>
        <DialogActions style={{margin:'10px'}}>        
          <Button onClick={() => setShowAddServiceModal(false)} variant="contained" color="error">
            Cancelar
          </Button>
          <Button onClick={handleAddService} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      )}
    <TableContainer component={Paper} style={{ overflowX: 'auto' }} className="tabla">
      <Table sx={{ width: 'auto' }} aria-label="customized table">
        <TableHead>
          <StyledTableRowHeader>
            <StyledTableCellHeader>TRATAMIENTO</StyledTableCellHeader>
            <StyledTableCellHeader style={{width:'12%'}}>CANTIDAD</StyledTableCellHeader>
            <StyledTableCellHeader style={{width:'20%'}}>PRECIO UNITARIO</StyledTableCellHeader>
            <StyledTableCellHeader>TOTAL</StyledTableCellHeader>
            <StyledTableCellHeader></StyledTableCellHeader>
          </StyledTableRowHeader>
        </TableHead>
        <TableBody>
          {selectedServices.map((service) => (
            <StyledTableRow key={service.id}>
              <StyledTableCell>{service.servicio}</StyledTableCell>
              <StyledTableCell>
              <TextField
                type="number"
                value={service.cantidad}
                onChange={(event) => handleQuantityChange(event, service.id)}
                variant="outlined"
                size="small"
                InputProps={{ inputProps: { min: 0 } }}
              />
              </StyledTableCell>
              <StyledTableCell>${service.precio}</StyledTableCell>
              <StyledTableCell>${service.precio * service.cantidad}</StyledTableCell>
              <StyledTableCell style={{width:'22%'}}>
                <Button variant="contained" color="primary" onClick={() => handleEditService(service)} style={{ marginRight: '10px' }}><EditIcon /></Button>
                <Button variant="contained" color="error" onClick={() => handleDeleteServiceConfirmation(service.id)}><DeleteForeverIcon /></Button>
              </StyledTableCell>
            </StyledTableRow>
          ))}
          <TableRow>
            <TableCell colSpan={2}/>
            <StyledTableCell style={{textAlign:'right'}}>
              <strong>Total:</strong>
            </StyledTableCell>
            <StyledTableCell><strong>${totalPrice}</strong></StyledTableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>

    <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
      <DialogTitle style={{fontSize:'15px', fontWeight:'bold'}}>EDITAR TRATAMIENTO</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          id="servicio"
          label="Tratamiento"
          type="text"
          fullWidth
          value={editedService ? editedService.servicio : ''}
          onChange={(e) => setEditedService({ ...editedService, servicio: e.target.value })}
        />
        <TextField
          margin="dense"
          id="precio"
          label="Precio"
          type="number"
          fullWidth
          value={editedService ? editedService.precio : ''}
          onChange={(e) => setEditedService({ ...editedService, precio: e.target.value })}
        />
      </DialogContent>
      <DialogActions style={{margin:'10px'}}>
      <Button onClick={handleCloseEditDialog} variant="contained" color="error">Cancelar</Button>
      <Button onClick={handleEditServiceInDialog} variant="contained" color="primary">
          Guardar
        </Button>          
      </DialogActions>
</Dialog>

<div className="container">
    <Observaciones
        tratamientoSeleccionado={selectedTratamiento}
        onTratamientoChange={setSelectedTratamiento} // Pasar la función de actualización
    />
</div>
      
      <Button variant="contained" color="success" onClick={handleOpenSavePDFConfirmation} style={{marginTop:'20px'}}>Guardar PDF</Button>

      <Dialog
      open={savePDFConfirmationOpen}
      onClose={handleCloseSavePDFConfirmation}
    >
      <DialogTitle>¿Estás seguro que deseas guardar el PDF?</DialogTitle>
      <DialogActions style={{margin:'10px'}}>
        <Button onClick={handleCloseSavePDFConfirmation} variant="contained" color="error">
          Cancelar
        </Button>
        <Button onClick={handleConfirmSavePDF} variant="contained" color="success">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>

      {showDeleteConfirmation && (
        <Dialog open={showDeleteConfirmation} onClose={() => setShowDeleteConfirmation(false)}>
        <DialogTitle>¿Estás seguro que deseas eliminar el tratamiento?</DialogTitle>
        <DialogActions style={{margin:'10px'}}>         
          <Button onClick={() => setShowDeleteConfirmation(false)} variant="contained" color="error">
            Cancelar
          </Button>
          <Button onClick={() => handleDeleteService(selectedServiceIdToDelete)} variant="contained" color="primary">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </div>
  );
}
export default App;
