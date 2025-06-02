'use client';

import { useState } from 'react';

interface CurvePoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

import type { PumpCurve } from '../../types';

interface ExistingCurvesCardProps {
  curves: PumpCurve[];
  onEdit: (curve: PumpCurve) => void;
  onDelete: (curveId: number) => void;
}

export default function ExistingCurvesCard({ curves, onEdit, onDelete }: ExistingCurvesCardProps) {
  const [expandedCurves, setExpandedCurves] = useState<number[]>([]);

  const toggleCurve = (curveId: number) => {
    if (expandedCurves.includes(curveId)) {
      setExpandedCurves(expandedCurves.filter((id) => id !== curveId));
    } else {
      setExpandedCurves([...expandedCurves, curveId]);
    }
  };

  return (
    <div className="bg-background rounded-xl shadow-md p-4 sm:p-6 border border-brandColor1/50">
      <h2 className="text-xl font-semibold text-foreground/90 mb-6">Existing Performance Curves</h2>
      <div className="space-y-4">
        {curves.length === 0 && (
          <p className="text-center text-sm text-foreground/60 py-4">
            No performance curves have been added for this pump yet.
          </p>
        )}
        {curves.map((curve, index) => (
          <div
            key={curve.id}
            className={`rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-lg mb-3 ${index % 2 === 0 ? 'bg-content-background/20 dark:bg-zinc-800/30' : 'bg-transparent'} border-brandColor1/30 hover:border-brandColor2/70`}
          >
            <div
              className="p-4 cursor-pointer flex items-center justify-between hover:bg-brandColor1/10 dark:hover:bg-brandColor1/20 transition-colors"
              onClick={() => toggleCurve(curve.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`transform transition-transform duration-200 ${expandedCurves.includes(curve.id) ? 'rotate-90' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground/70" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-base font-medium text-foreground">
                  Speed: {curve.speed} RPM {curve.isScaled && <span className="text-xs text-foreground/60">(Scaled)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(curve);
                  }}
                  className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-md hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors"
                  title="Edit curve"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(curve.id);
                  }}
                  className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                  title="Delete curve"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {expandedCurves.includes(curve.id) && (
              <div className="border-t border-brandColor1/30">
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brandColor1/20">
                      <thead>
                        <tr className="bg-brandColor1/5 dark:bg-brandColor1/10">
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Flow (GPM)</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Head (ft)</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Efficiency (%)</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-foreground/70">Power (HP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brandColor1/20">
                        {curve.points.split(';')
                          .map((point: string) => {
                            const [flow, head, efficiency, power] = point.split(',');
                            return { flow: Number(flow), head, efficiency, power };
                          })
                          .sort((a, b) => a.flow - b.flow)
                          .map((point, idx) => (
                            <tr key={idx} className="hover:bg-brandColor1/10 dark:hover:bg-brandColor1/15 transition-colors">
                              <td className="px-4 py-2 text-sm text-foreground/90 whitespace-nowrap">{point.flow}</td>
                              <td className="px-4 py-2 text-sm text-foreground/90 whitespace-nowrap">{point.head}</td>
                              <td className="px-4 py-2 text-sm text-foreground/90 whitespace-nowrap">{point.efficiency}</td>
                              <td className="px-4 py-2 text-sm text-foreground/90 whitespace-nowrap">{point.power}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}