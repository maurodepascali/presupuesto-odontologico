import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import './App.css'; // No se necesitan estilos en línea, ya que importamos el archivo CSS aquí
import { generatePDF } from './PresupuestoPDF';
import Observaciones from './Observaciones';
import Button from '@mui/material/Button';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { styled } from '@mui/material/styles';
import { Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
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
const [selectedTratamiento, setSelectedTratamiento] = useState('');

const handleTratamientoChange = (value) => {
  setSelectedTratamiento(value);
  // Cambia setObservaciones por setSelectedTratamiento
  setObservaciones(value === 'tratamiento1' ? observaciones.tratamiento1 : observaciones.tratamiento2);
};

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesSnapshot = await getDocs(collection(db, 'servicios'));
        const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServices(servicesData);
      } catch (error) {
        console.error('Error al obtener los servicios:', error.message);
      }
      
    };

    fetchServices();
  }, []);

  const handleServiceChange = (event) => {
    const selectedId = event.target.value;
    const selectedService = services.find(service => service.id === selectedId);
    if (selectedService) {
      if (!selectedServices.some(service => service.id === selectedService.id)) {
        setSelectedServices([...selectedServices, { ...selectedService, cantidad: 1 }]);
        const totalPriceIncrement = selectedService.precio * 1;
        setTotalPrice(totalPrice + totalPriceIncrement);
      }
      event.target.selectedIndex = 0;
    }
  };

  const handleQuantityChange = (event, id) => {
    const quantity = parseInt(event.target.value);
    const updatedServices = selectedServices.map(service =>
      service.id === id ? { ...service, cantidad: quantity } : service
    );
    setSelectedServices(updatedServices);
    recalculateTotalPrice(updatedServices);
  };

  const recalculateTotalPrice = (services) => {
    const totalPrice = services.reduce((total, service) => {
      return total + (service.cantidad > 0 ? service.precio * service.cantidad : 0);
    }, 0);
    setTotalPrice(totalPrice);
  };

  const handleAddService = async () => {
    try {
      const docRef = await addDoc(collection(db, 'servicios'), newServiceData);
      const addedService = { id: docRef.id, ...newServiceData };
      setServices([...services, addedService]);
      setSelectedServices([...selectedServices, { ...addedService, cantidad: 1 }]);
      setShowAddServiceModal(false);
      setNewServiceData({ servicio: '', cantidad: 0, precio: 0 });
      
      // Recalcular el precio total
      const totalPriceIncrement = newServiceData.precio * 1;
      setTotalPrice(totalPrice + totalPriceIncrement);
    } catch (error) {
      console.error('Error al agregar el servicio:', error.message);
    }
  };

  const handleEditService = async (service) => {
    setEditedService(service);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

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
        recalculateTotalPrice(updatedSelectedServices); // Recalculate el precio total

        setOpenEditDialog(false);
    } catch (error) {
        console.error('Error al editar el servicio:', error.message);
    }
};

const handleDeleteServiceAndSelect = async (serviceId) => {
  try {
    // Eliminar el servicio de la base de datos
    await deleteDoc(doc(db, 'servicios', serviceId));

    // Filtrar los servicios seleccionados para eliminar el servicio específico
    const updatedSelectedServices = selectedServices.filter(service => service.id !== serviceId);
    setSelectedServices(updatedSelectedServices);

    // Verificar si la lista de servicios seleccionados está vacía
    if (updatedSelectedServices.length === 0) {
      setTotalPrice(0); // Establecer el precio total en 0 si no hay servicios seleccionados
    } else {
      recalculateTotalPrice(updatedSelectedServices); // Recalcular el precio total si hay servicios seleccionados
    }

    // Eliminar el servicio del menú (select)
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
  } catch (error) {
    console.error('Error al eliminar el servicio:', error.message);
  }
};


  const handleDeleteServiceConfirmation = (id) => {
    setShowDeleteConfirmation(true);
    setSelectedServiceIdToDelete(id);
  };

  const handleDeleteService = (id) => {
    const updatedSelectedServices = selectedServices.filter(service => service.id !== id);
    setSelectedServices(updatedSelectedServices);
    setShowDeleteConfirmation(false);
  
    // Recalcular el precio total si hay servicios seleccionados
    recalculateTotalPrice(updatedSelectedServices);
  };

  const handleSaveAsPDF = () => {
    generatePDF(selectedServices, totalPrice, patientName, observaciones, selectedTratamiento, subtitle);
  };
  
  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));
  
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
  }));

  const handleOpenDeleteConfirmation = (serviceId) => {
    setServiceIdToDelete(serviceId);
    setDeleteConfirmationOpen(true);
  };
  
  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
  };
  
  const handleConfirmDelete = () => {
    handleCloseDeleteConfirmation();
    handleDeleteServiceAndSelect(serviceIdToDelete);
  };

  const handleOpenSavePDFConfirmation = () => {
  setSavePDFConfirmationOpen(true);
};

const handleCloseSavePDFConfirmation = () => {
  setSavePDFConfirmationOpen(false);
};

const handleConfirmSavePDF = () => {
  handleCloseSavePDFConfirmation();
  handleSaveAsPDF();
};

const StyledTableRowHeader = styled(TableRow)(({ theme }) => ({
  backgroundColor: '#7FFFD4',
}));

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
