import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

// Estilos de glassmorphism reutilizables para toda la app
export const GLASS = {
  // Contenedor principal con fondo translúcido
  container: {
    flex: 1,
    backgroundColor: COLORS.spaceCadet,
  },
  // Tarjeta glassmorphism
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  // Tarjeta blanca sólida (para contenido de texto)
  cardSolid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  // Header con fondo translúcido
  header: {
    backgroundColor: 'rgba(37, 52, 79, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 184, 147, 0.3)',
    padding: 16,
    paddingTop: 44,
  },
  // Botón principal (pastilla)
  buttonPrimary: {
    backgroundColor: COLORS.coffee,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Botón secundario (glass)
  buttonSecondary: {
    backgroundColor: 'rgba(213, 184, 147, 0.25)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(213, 184, 147, 0.5)',
  },
  // Botón de acción central (grande)
  buttonAction: {
    backgroundColor: COLORS.caput,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  // Input glass
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.spaceCadet,
  },
  // Selector glass
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(97, 120, 145, 0.4)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  // Modal overlay
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Modal box
  modalBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(213, 184, 147, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  // Texto principal
  textPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  // Texto secundario
  textSecondary: {
    color: 'rgba(213, 184, 147, 0.9)',
    fontSize: 14,
  },
  // Título
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Subtítulo
  subtitle: {
    fontSize: 14,
    color: 'rgba(213, 184, 147, 0.9)',
  },
  // Badge de estado
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  // Loader
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default GLASS;