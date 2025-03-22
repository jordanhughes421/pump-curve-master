'use client';

import { useState, useEffect, useRef } from 'react';

interface CurvePoint {
  flow: string;
  head: string;
  efficiency: string;
  power: string;
}

interface PumpCurve {
  id: number;
  speed: number;
  points: string;
}

interface UploadCurveFormProps {
  pumpId: number;
  onSuccess: () => void;
  existingCurves: PumpCurve[];
  editingCurve?: PumpCurve;
}

export default function UploadCurveForm({ pumpId, onSuccess, existingCurves, editingCurve }: UploadCurveFormProps) {
  const [speed, setSpeed] = useState(editingCurve?.speed.toString() || '');
  const [points, setPoints] = useState<CurvePoint[]>(() => {
    if (editingCurve) {
      return editingCurve.points.split(';').map(point => {
        const [flow, head, efficiency, power] = point.split(',');
        return { flow, head, efficiency, power };
      });
    }
    return [{ flow: '', head: '', efficiency: '', power: '' }];
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCurve) {
      setSpeed(editingCurve.speed.toString());
      setPoints(editingCurve.points.split(';').map(point => {
        const [flow, head, efficiency, power] = point.split(',');
        return { flow, head, efficiency, power };
      }));
    }
  }, [editingCurve]);

  const addPoint = () => {
    setPoints([...points, { flow: '', head: '', efficiency: '', power: '' }]);
  };

  const removePoint = (index: number) => {
    if (points.length > 1) {
      setPoints(points.filter((_, i) => i !== index));
    }
  };

  const updatePoint = (index: number, field: keyof CurvePoint, value: string) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setPoints(newPoints);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: keyof CurvePoint) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === points.length - 1) {
        addPoint();
        // Focus will be handled by useEffect
      } else {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"][data-field="${field}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
    // Commenting out backspace delete functionality
    /*
    else if (e.key === 'Backspace' && points[index][field] === '' && index > 0) {
      removePoint(index);
      const prevInput = document.querySelector(`input[data-index="${index - 1}"][data-field="${field}"]`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
    */
  };

  useEffect(() => {
    if (lastInputRef.current) {
      lastInputRef.current.focus();
    }
  }, [points.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    if (!speed || points.length === 0) {
      setError('Please fill in all fields');
      return;
    }

    // Validate each point has all required fields
    const hasEmptyFields = points.some(point => 
      point.flow === '' || point.head === '' || point.efficiency === '' || point.power === ''
    );

    if (hasEmptyFields) {
      setError('Please fill in all fields for each point');
      return;
    }

    // Validate all values are numbers
    const hasInvalidNumbers = points.some(point => 
      isNaN(Number(point.flow)) || isNaN(Number(point.head)) || 
      isNaN(Number(point.efficiency)) || isNaN(Number(point.power))
    );

    if (hasInvalidNumbers) {
      setError('All values must be numbers');
      return;
    }

    // Convert points to string format
    const pointsString = points.map(point => 
      `${point.flow},${point.head},${point.efficiency},${point.power}`
    ).join(';');

    try {
      const response = await fetch(
        editingCurve 
          ? `/api/pumps/${pumpId}/curves/${editingCurve.id}`
          : `/api/pumps/${pumpId}/curves`,
        {
          method: editingCurve ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            speed: Number(speed),
            points: pointsString,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save curve');
      }

      onSuccess();
      setError('');
      setSpeed('');
      setPoints([{ flow: '', head: '', efficiency: '', power: '' }]);
    } catch (err) {
      setError('Failed to save curve. Please try again.');
    }
  };

  return (
    <div className="bg-brandColor5 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-brandColor1 mb-2">
        {editingCurve ? 'Edit Performance Curve' : 'Add New Performance Curve'}
      </h2>
      <p className="text-brandColor1 mb-6">
        {editingCurve 
          ? 'Update the performance curve data below.'
          : 'Enter the pump performance curve data below. Press Enter to add more points and Backspace to remove points.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="speed" className="block text-sm font-medium text-brandColor1 mb-2">
            Speed (RPM)
          </label>
          <input
            type="number"
            id="speed"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="w-full px-4 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 bg-white text-brandColor1"
            required
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-brandColor1 mb-4">Curve Points</h3>
          <div className="space-y-4">
            {points.map((point, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-brandColor3 hover:border-brandColor1 transition-colors"
              >
                <div>
                  <label className="block text-sm font-medium text-brandColor1 mb-1">Flow (GPM)</label>
                  <input
                    type="number"
                    value={point.flow}
                    onChange={(e) => updatePoint(index, 'flow', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 'flow')}
                    className="w-full px-3 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 text-brandColor1"
                    data-index={index}
                    data-field="flow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brandColor1 mb-1">Head (ft)</label>
                  <input
                    type="number"
                    value={point.head}
                    onChange={(e) => updatePoint(index, 'head', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 'head')}
                    className="w-full px-3 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 text-brandColor1"
                    data-index={index}
                    data-field="head"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brandColor1 mb-1">Efficiency (%)</label>
                  <input
                    type="number"
                    value={point.efficiency}
                    onChange={(e) => updatePoint(index, 'efficiency', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, 'efficiency')}
                    className="w-full px-3 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 text-brandColor1"
                    data-index={index}
                    data-field="efficiency"
                    required
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-brandColor1 mb-1">Power (HP)</label>
                    <input
                      type="number"
                      value={point.power}
                      onChange={(e) => updatePoint(index, 'power', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, 'power')}
                      className="w-full px-3 py-2 border border-brandColor3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 text-brandColor1"
                      data-index={index}
                      data-field="power"
                      required
                    />
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removePoint(index)}
                      className="p-2 text-red-500 hover:text-red-600 focus:outline-none rounded-full hover:bg-red-50 transition-colors"
                      title="Remove point"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPoint}
            className="mt-4 px-4 py-2 bg-brandColor1 text-brandColor5 rounded-lg hover:bg-brandColor2 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Point
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          {editingCurve && (
            <button
              type="button"
              onClick={() => {
                setSpeed('');
                setPoints([{ flow: '', head: '', efficiency: '', power: '' }]);
                onSuccess();
              }}
              className="px-4 py-2 border border-brandColor3 text-brandColor1 rounded-lg hover:bg-brandColor3 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brandColor1 text-brandColor5 rounded-lg hover:bg-brandColor2 focus:outline-none focus:ring-2 focus:ring-brandColor1 focus:border-brandColor1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {editingCurve ? 'Update Curve' : 'Save Curve'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 