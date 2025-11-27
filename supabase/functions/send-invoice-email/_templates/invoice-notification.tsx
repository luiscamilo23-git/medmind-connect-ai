import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface InvoiceNotificationEmailProps {
  patient_name: string
  invoice_number: string
  invoice_status: 'approved' | 'rejected'
  cufe?: string
  error_message?: string
  total_amount: number
  pdf_url?: string
  xml_url?: string
}

export const InvoiceNotificationEmail = ({
  patient_name,
  invoice_number,
  invoice_status,
  cufe,
  error_message,
  total_amount,
  pdf_url,
  xml_url,
}: InvoiceNotificationEmailProps) => {
  const isApproved = invoice_status === 'approved'
  
  return (
    <Html>
      <Head />
      <Preview>
        {isApproved 
          ? `Tu factura ${invoice_number} ha sido aprobada por la DIAN` 
          : `Actualización sobre tu factura ${invoice_number}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isApproved ? '✅ Factura Aprobada' : '⚠️ Actualización de Factura'}
          </Heading>
          
          <Text style={text}>
            Hola {patient_name},
          </Text>
          
          {isApproved ? (
            <>
              <Text style={text}>
                Nos complace informarte que tu factura electrónica ha sido <strong>aprobada exitosamente</strong> por la DIAN.
              </Text>
              
              <Section style={infoBox}>
                <Text style={infoTitle}>Detalles de la Factura:</Text>
                <Text style={infoText}>
                  <strong>Número de Factura:</strong> {invoice_number}
                </Text>
                <Text style={infoText}>
                  <strong>Valor Total:</strong> ${total_amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })} COP
                </Text>
                {cufe && (
                  <Text style={infoText}>
                    <strong>CUFE:</strong> {cufe.substring(0, 40)}...
                  </Text>
                )}
              </Section>
              
              <Text style={text}>
                Puedes descargar tu factura en los siguientes formatos:
              </Text>
              
              <Section style={buttonContainer}>
                {pdf_url && (
                  <Link href={pdf_url} style={{...button, marginRight: '10px'}}>
                    Descargar PDF
                  </Link>
                )}
                {xml_url && (
                  <Link href={xml_url} style={button}>
                    Descargar XML
                  </Link>
                )}
              </Section>
            </>
          ) : (
            <>
              <Text style={text}>
                Queremos informarte que tu factura electrónica <strong>N° {invoice_number}</strong> ha sido rechazada por la DIAN.
              </Text>
              
              {error_message && (
                <Section style={errorBox}>
                  <Text style={errorTitle}>Motivo del rechazo:</Text>
                  <Text style={errorText}>{error_message}</Text>
                </Section>
              )}
              
              <Text style={text}>
                Nuestro equipo está trabajando en corregir el problema. Te notificaremos cuando la factura sea reemitida exitosamente.
              </Text>
            </>
          )}
          
          <Hr style={hr} />
          
          <Text style={footerText}>
            Este es un correo automático generado por nuestro sistema de facturación electrónica.
            Para cualquier consulta, por favor contacta con tu proveedor de servicios de salud.
          </Text>
          
          <Text style={footer}>
            <strong>MEDMIND</strong> - Sistema de Gestión Médica
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InvoiceNotificationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 40px',
}

const infoBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '24px',
}

const infoTitle = {
  color: '#0369a1',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const errorBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  border: '1px solid #fecaca',
  margin: '24px 40px',
  padding: '24px',
}

const errorTitle = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const errorText = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 40px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 40px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '32px 40px',
}
