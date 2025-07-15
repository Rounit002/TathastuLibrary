import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import Select, { OnChangeValue } from 'react-select';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Define interfaces based on api.ts
interface Student {
  id: number;
  name: string;
  registrationNumber?: string | null;
  fatherName?: string | null;
  aadharNumber?: string | null;
  email: string;
  phone: string;
  address: string;
  branchId: number;
  branchName?: string;
  membershipStart: string;
  membershipEnd: string;
  status: 'active' | 'expired';
  totalFee: number;
  amountPaid: number;
  dueAmount: number;
  cash: number;
  online: number;
  securityMoney: number;
  remark: string | null;
  profileImageUrl?: string | null;
  createdAt: string;
  assignments?: Array<{
    seatId: number;
    shiftId: number;
    seatNumber: string;
    shiftTitle: string;
  }>;
}

interface Schedule {
  id: number;
  title: string;
  description?: string | null; // FIX: Made description optional to match API response type
  time: string;
  eventDate: string;
}

interface Seat {
  id: number;
  seatNumber: string;
  branchId?: number;
}

interface Branch {
  id: number;
  name: string;
  code?: string | null;
}

interface FormData {
  name: string;
  registrationNumber: string;
  fatherName: string;
  aadharNumber: string;
  email: string;
  phone: string;
  address: string;
  branchId: number | null;
  membershipStart: string;
  membershipEnd: string;
  shiftIds: number[];
  seatId: number | null;
  totalFee: string;
  cash: string;
  online: string;
  securityMoney: string;
  remark: string;
  image: File | null;
  profileImageUrl: string;
}

interface ShiftOption {
    value: number;
    label: string;
    isDisabled?: boolean;
}

interface SelectOption {
    value: number | null;
    label: string;
}

const EditStudentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    registrationNumber: '',
    fatherName: '',
    aadharNumber: '',
    email: '',
    phone: '',
    address: '',
    branchId: null,
    membershipStart: '',
    membershipEnd: '',
    shiftIds: [],
    seatId: null,
    totalFee: '',
    cash: '',
    online: '',
    securityMoney: '',
    remark: '',
    image: null,
    profileImageUrl: '',
  });

  const [allShifts, setAllShifts] = useState<Schedule[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Schedule[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [originalStudentData, setOriginalStudentData] = useState<Student | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const studentId = id ? parseInt(id, 10) : NaN;

  useEffect(() => {
    const fetchInitialData = async () => {
      if (isNaN(studentId)) {
        toast.error('Invalid student ID.');
        setLoading(false);
        return;
      }
      try {
        const [studentResponse, shiftsResponse, branchesResponse] = await Promise.all([
          api.getStudent(studentId),
          api.getSchedules(),
          api.getBranches(),
        ]);
        
        const student: Student = studentResponse;
        setOriginalStudentData(student);
        setAllShifts(shiftsResponse.schedules);
        setBranches(branchesResponse);

        setFormData({
          name: student.name || '',
          registrationNumber: student.registrationNumber || '',
          fatherName: student.fatherName || '',
          aadharNumber: student.aadharNumber || '',
          email: student.email || '',
          phone: student.phone || '',
          address: student.address || '',
          branchId: student.branchId || null,
          membershipStart: student.membershipStart ? student.membershipStart.split('T')[0] : '',
          membershipEnd: student.membershipEnd ? student.membershipEnd.split('T')[0] : '',
          shiftIds: student.assignments?.map(a => a.shiftId) ?? [],
          seatId: student.assignments?.[0]?.seatId || null,
          totalFee: student.totalFee ? student.totalFee.toString() : '0',
          cash: student.cash ? student.cash.toString() : '0',
          online: student.online ? student.online.toString() : '0',
          securityMoney: student.securityMoney ? student.securityMoney.toString() : '0',
          remark: student.remark || '',
          image: null,
          profileImageUrl: student.profileImageUrl || '',
        });
      } catch (error: any) {
        console.error('Failed to fetch initial data:', error);
        toast.error(error.message || 'Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [studentId]);

  useEffect(() => {
    const fetchSeats = async () => {
      if (formData.branchId) {
        setLoadingSeats(true);
        try {
          const seatsResponse = await api.getSeats({ branchId: formData.branchId });
          setSeats(seatsResponse.seats);
        } catch (error: any) {
          console.error('Failed to fetch seats:', error);
          toast.error(error.message || 'Failed to load seats');
        } finally {
          setLoadingSeats(false);
        }
      } else {
        setSeats([]);
      }
    };
    fetchSeats();
  }, [formData.branchId]);

  useEffect(() => {
    const fetchAvailableShifts = async () => {
      if (formData.seatId) {
        setLoadingShifts(true);
        try {
          const response = await api.getAvailableShifts(formData.seatId);
          setAvailableShifts(response.availableShifts);
        } catch (error: any) {
          console.error('Failed to fetch available shifts:', error);
          toast.error(error.message || 'Failed to load available shifts');
        } finally {
          setLoadingShifts(false);
        }
      } else {
        setAvailableShifts(allShifts);
      }
    };
    fetchAvailableShifts();
  }, [formData.seatId, allShifts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'seatId' | 'branchId', option: OnChangeValue<SelectOption, false>) => {
    setFormData(prev => ({...prev, [name]: option ? option.value : null}));
    if (name === 'seatId') {
      setFormData(prev => ({...prev, shiftIds: []})); // Reset shifts when seat changes
    }
  };
  
  const handleShiftSelectChange = (options: OnChangeValue<ShiftOption, true>) => {
    setFormData(prev => ({...prev, shiftIds: options ? options.map(o => o.value) : []}));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Only JPEG, JPG, PNG, and GIF images are allowed');
        return;
      }
      if (file.size > 200 * 1024) {
        toast.error('Image size exceeds 200KB limit');
        return;
      }
      setFormData(prev => ({ ...prev, image: file, profileImageUrl: URL.createObjectURL(file) }));
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.branchId || !formData.membershipStart || !formData.membershipEnd) {
      toast.error('Name, Phone, Address, Branch, and Membership Dates are required');
      return;
    }
    if (formData.email.trim() && !validateEmail(formData.email)) {
      toast.error('Please enter a valid email address or leave it empty');
      return;
    }
    if (new Date(formData.membershipStart) >= new Date(formData.membershipEnd)) {
      toast.error('Membership End date must be after Membership Start date');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = formData.profileImageUrl;
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.image);
        const uploadResponse = await api.uploadImage(imageFormData);
        imageUrl = uploadResponse.imageUrl || '';
      }

      const totalFeeValue = parseFloat(formData.totalFee) || 0;
      const cashValue = parseFloat(formData.cash) || 0;
      const onlineValue = parseFloat(formData.online) || 0;

      const payload = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        fatherName: formData.fatherName,
        aadharNumber: formData.aadharNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        branchId: formData.branchId!,
        membershipStart: formData.membershipStart,
        membershipEnd: formData.membershipEnd,
        totalFee: totalFeeValue,
        amountPaid: cashValue + onlineValue,
        shiftIds: formData.shiftIds,
        seatId: formData.seatId,
        cash: cashValue,
        online: onlineValue,
        securityMoney: parseFloat(formData.securityMoney) || 0,
        remark: formData.remark,
        profileImageUrl: imageUrl,
      };
      
      await api.updateStudent(studentId, payload);
      toast.success('Student updated successfully');
      navigate('/students');
    } catch (error: any) {
      console.error('Failed to update student:', error);
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };
  
  const seatOptions: SelectOption[] = [
    { value: null, label: 'None' },
    ...seats.map((seat) => ({ value: seat.id, label: seat.seatNumber })),
  ];
  
  const shiftOptions: ShiftOption[] = allShifts.map(shift => {
    const isAvailable = availableShifts.some(s => s.id === shift.id);
    const isOriginallyAssigned = originalStudentData?.assignments?.some(a => a.shiftId === shift.id) ?? false;
    const isSeatSelected = formData.seatId !== null;

    let label = `${shift.title} at ${shift.time} (${shift.eventDate})`;
    if (isSeatSelected) {
        label += (isAvailable || isOriginallyAssigned) ? ' (Available)' : ' (Assigned)';
    }

    return {
      value: shift.id,
      label,
      isDisabled: isSeatSelected && !isAvailable && !isOriginallyAssigned,
    };
  });

  const cashAmount = parseFloat(formData.cash) || 0;
  const onlineAmount = parseFloat(formData.online) || 0;
  const totalAmountPaid = cashAmount + onlineAmount;
  const dueAmount = (parseFloat(formData.totalFee) || 0) - totalAmountPaid;

  if (loading) {
    return <div className="p-6 animate-pulse text-center">Loading...</div>;
  }
  
  if (isNaN(studentId)) {
    return <div className="p-6 text-red-500 text-center">Invalid student ID.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
          <div />
        </div>
        <div className="space-y-4">
          
          {formData.profileImageUrl && (
            <div className="flex justify-center">
              <img src={formData.profileImageUrl} alt="Student Profile" className="w-32 h-32 rounded-full object-cover"/>
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <input type="text" id="registrationNumber" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
          
          <div>
            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
            <input type="text" id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
            <input type="text" id="aadharNumber" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
          
          <div>
            <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <Select
                id="branchId"
                name="branchId"
                options={branches.map(b => ({value: b.id, label: b.name}))}
                value={branches.map(b => ({value: b.id, label: b.name})).find(o => o.value === formData.branchId)}
                onChange={(option) => handleSelectChange('branchId', option)}
                placeholder="Select a branch"
                className="w-full"
            />
          </div>

          <div>
            <label htmlFor="membershipStart" className="block text-sm font-medium text-gray-700 mb-1">Membership Start</label>
            <input type="date" id="membershipStart" name="membershipStart" value={formData.membershipStart} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="membershipEnd" className="block text-sm font-medium text-gray-700 mb-1">Membership End</label>
            <input type="date" id="membershipEnd" name="membershipEnd" value={formData.membershipEnd} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
          
          <div>
            <label htmlFor="seatId" className="block text-sm font-medium text-gray-700 mb-1">Select Seat</label>
            <Select
              id="seatId"
              name="seatId"
              options={seatOptions}
              isLoading={loadingSeats}
              value={seatOptions.find(option => option.value === formData.seatId)}
              onChange={(option) => handleSelectChange('seatId', option)}
              isSearchable
              placeholder="Select a seat or None"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="shiftIds" className="block text-sm font-medium text-gray-700 mb-1">Select Shift(s)</label>
            <Select
                isMulti
                id="shiftIds"
                name="shiftIds"
                options={shiftOptions}
                value={shiftOptions.filter(option => formData.shiftIds.includes(option.value))}
                onChange={handleShiftSelectChange}
                isLoading={loadingShifts}
                isOptionDisabled={(option) => option.isDisabled ?? false}
                placeholder="Select one or more shifts"
                className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="totalFee" className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
            <input type="number" id="totalFee" name="totalFee" value={formData.totalFee} onChange={handleChange} step="0.01" min="0" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="cash" className="block text-sm font-medium text-gray-700 mb-1">Cash Payment</label>
            <input type="number" id="cash" name="cash" value={formData.cash} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="online" className="block text-sm font-medium text-gray-700 mb-1">Online Payment</label>
            <input type="number" id="online" name="online" value={formData.online} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>
          
          <div>
            <label htmlFor="securityMoney" className="block text-sm font-medium text-gray-700 mb-1">Security Money</label>
            <input type="number" id="securityMoney" name="securityMoney" value={formData.securityMoney} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"/>
          </div>

          <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">Total Amount Paid</label>
            <input type="number" id="amountPaid" name="amountPaid" value={totalAmountPaid.toFixed(2)} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"/>
          </div>

          <div>
            <label htmlFor="dueAmount" className="block text-sm font-medium text-gray-700 mb-1">Due Amount</label>
            <input type="number" id="dueAmount" name="dueAmount" value={dueAmount.toFixed(2)} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"/>
          </div>
          
          <div>
            <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
            <textarea id="remark" name="remark" value={formData.remark} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" rows={3}/>
          </div>
          
          <div>
             <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Profile Image (max 200KB)</label>
             <input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg"/>
          </div>
          
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full" disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200 disabled:bg-purple-400">
              {submitting ? 'Updating...' : 'Update Student'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStudentForm;