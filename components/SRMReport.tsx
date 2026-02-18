'use client';

import React, { useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { NISTCatalog } from '@/types/nist';
import { NISTRevision, useSRMStore } from '@/store/useSRMStore';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 10,
  },
  logo: {
    width: 100,
  },
  titleContainer: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 4,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginHorizontal: 30,
  },
  table: {
    display: 'flex',
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 25,
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 9,
    padding: 5,
    textAlign: 'center',
  },
  cell: {
    padding: 5,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstCell: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  cellText: {
    fontSize: 7.5,
    lineHeight: 1.2,
    textAlign: 'center',
  },
  bgCorvid: { backgroundColor: '#93C5FD' },
  bgCustomer: { backgroundColor: '#86EFAC' },
  bgShared: { backgroundColor: '#FDE047' },
  textCorvid: { color: '#1E40AF' },
  textCustomer: { color: '#166534' },
  textShared: { color: '#A16207' },
});

const colsWithImplementation = StyleSheet.create({
  colDomain: { width: '12%' },
  colControl: { width: '15%' },
  colAO: { width: '12%' },
  colObjective: { width: '31%' },
  colResponsibility: { width: '12%' },
  colImplementation: { width: '18%' },
});

const colsWithoutImplementation = StyleSheet.create({
  colDomain: { width: '14%' },
  colControl: { width: '18%' },
  colAO: { width: '14%' },
  colObjective: { width: '40%' },
  colResponsibility: { width: '14%' },
});

interface SRMReportProps {
  catalog: NISTCatalog;
  revision: NISTRevision;
  includeImplementation: boolean;
}

export default function SRMReport({ catalog, revision, includeImplementation }: SRMReportProps) {
  const entries = useSRMStore.getState().entries;
  const revisionLabel = revision === 'rev2' ? 'Rev 2' : 'Rev 3';
  
  const colStyles = includeImplementation ? colsWithImplementation : colsWithoutImplementation;
  
  const flattenedRows = useMemo(() => catalog.families.flatMap(family => 
    family.controls.flatMap(control => 
      control.objectives.map(obj => {
        let aoDisplay = obj.id.split('_').pop() || '';
        if (aoDisplay.startsWith('DS-A.')) {
            aoDisplay = aoDisplay.replace('DS-A.', '');
        }

        return {
          familyTitle: family.title,
          controlLabel: control.label,
          aoId: aoDisplay,
          prose: obj.prose.replace(/{{.*?}}/g, '___'),
          id: obj.id,
          entry: entries[obj.id] || { responsibility: 'Customer', implementation: '' }
        };
      })
    )
  ), [catalog, entries]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Shared Responsibility Matrix (SRM)</Text>
            <Text style={styles.serviceName}>CMMC HPC Portal</Text>
            <Text style={styles.subtitle}>NIST SP 800-171 {revisionLabel} • Generated Report</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} fixed>
            <View style={[styles.cell, styles.firstCell, colStyles.colDomain]}><Text style={styles.headerText}>Domain</Text></View>
            <View style={[styles.cell, colStyles.colControl]}><Text style={styles.headerText}>Control</Text></View>
            <View style={[styles.cell, colStyles.colAO]}><Text style={styles.headerText}>AO</Text></View>
            <View style={[styles.cell, colStyles.colObjective]}><Text style={styles.headerText}>Assessment Objective</Text></View>
            <View style={[styles.cell, colStyles.colResponsibility]}><Text style={styles.headerText}>Responsibility</Text></View>
            {includeImplementation && (
              <View style={[styles.cell, styles.lastCell, colsWithImplementation.colImplementation]}><Text style={styles.headerText}>Implementation</Text></View>
            )}
          </View>

          {flattenedRows.map((row) => {
            const isCorvid = row.entry.responsibility === 'Corvid';
            const isCustomer = row.entry.responsibility === 'Customer';
            
            return (
              <View key={row.id} style={styles.tableRow} wrap={false}>
                <View style={[styles.cell, styles.firstCell, colStyles.colDomain]}>
                  <Text style={styles.cellText}>{row.familyTitle}</Text>
                </View>
                <View style={[styles.cell, colStyles.colControl]}>
                  <Text style={styles.cellText}>{row.controlLabel}</Text>
                </View>
                <View style={[styles.cell, colStyles.colAO]}>
                  <Text style={styles.cellText}>{row.aoId}</Text>
                </View>
                <View style={[styles.cell, colStyles.colObjective]}>
                  <Text style={styles.cellText}>{row.prose}</Text>
                </View>
                <View style={[
                  styles.cell, 
                  colStyles.colResponsibility,
                  includeImplementation ? {} : styles.lastCell,
                  isCorvid ? styles.bgCorvid : isCustomer ? styles.bgCustomer : styles.bgShared
                ]}>
                  <Text style={[
                    styles.cellText,
                    isCorvid ? styles.textCorvid : isCustomer ? styles.textCustomer : styles.textShared
                  ]}>{row.entry.responsibility}</Text>
                </View>
                {includeImplementation && (
                  <View style={[styles.cell, styles.lastCell, colsWithImplementation.colImplementation]}>
                    <Text style={styles.cellText}>{row.entry.implementation}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text 
          style={styles.footer} 
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} 
          fixed 
        />
      </Page>
    </Document>
  );
}
