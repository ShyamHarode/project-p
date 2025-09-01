import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid mobile number']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['Manager', 'Accountant'],
    default: 'Accountant'
  },
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  department: {
    type: String,
    default: 'Administration'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    canApproveAosts: {
      type: Boolean,
      default: false
    },
    canManageRevenue: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canManageEmployees: {
      type: Boolean,
      default: false
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Note: Indexes are automatically created from unique fields in schema

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  
  // Set permissions based on role
  if (this.isModified('role')) {
    if (this.role === 'Manager') {
      this.permissions = {
        canApprovePosts: true,
        canManageRevenue: true,
        canViewAnalytics: true,
        canManageEmployees: true
      };
    } else if (this.role === 'Accountant') {
      this.permissions = {
        canApprovePosts: false,
        canManageRevenue: false,
        canViewAnalytics: true,
        canManageEmployees: false
      };
    }
  }
  
  next();
});

// Virtual field for full display name
employeeSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.employeeId})`;
});

// Method to check if employee has specific permission
employeeSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] || false;
};

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
