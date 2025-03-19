'use client';

import { useState } from 'react';

interface CurvePoint {
  flow: number;
  head: number;
  efficiency: number;
  power: number;
}

interface PumpCurve {
  id: number;
  speed: number;
  points: string;
}

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
    <div className="bg-brandColor5 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-brandColor1 mb-4">Existing Performance Curves</h2>
      <div className="space-y-4">
        {curves.map((curve) => (
          <div
            key={curve.id}
            className="bg-white rounded-lg border border-brandColor3 overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            <div 
              className="p-4 cursor-pointer flex items-center justify-between hover:bg-brandColor5/50 transition-colors"
              onClick={() => toggleCurve(curve.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`transform transition-transform duration-200 ${expandedCurves.includes(curve.id) ? 'rotate-90' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brandColor1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-brandColor1">
                  Speed: {curve.speed} RPM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(curve);
                  }}
                  className="p-2 text-brandColor1 hover:text-brandColor2 rounded-full hover:bg-brandColor5 transition-colors"
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
                  className="p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete curve"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {expandedCurves.includes(curve.id) && (
              <div className="border-t border-brandColor3">
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brandColor3">
                      <thead>
                        <tr className="bg-brandColor5/50">
                          <th className="px-4 py-2 text-left text-sm font-medium text-brandColor1">Flow (GPM)</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-brandColor1">Head (ft)</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-brandColor1">Efficiency (%)</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-brandColor1">Power (HP)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brandColor3">
                        {curve.points.split(';')
                          .map((point: string) => {
                            const [flow, head, efficiency, power] = point.split(',');
                            return { flow: Number(flow), head, efficiency, power };
                          })
                          .sort((a, b) => a.flow - b.flow)
                          .map((point, index) => (
                            <tr key={index} className="hover:bg-brandColor5/30 transition-colors">
                              <td className="px-4 py-2 text-sm text-brandColor1">{point.flow}</td>
                              <td className="px-4 py-2 text-sm text-brandColor1">{point.head}</td>
                              <td className="px-4 py-2 text-sm text-brandColor1">{point.efficiency}</td>
                              <td className="px-4 py-2 text-sm text-brandColor1">{point.power}</td>
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