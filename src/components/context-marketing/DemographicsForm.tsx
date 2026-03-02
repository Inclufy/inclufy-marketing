import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DemographicsFormProps {
  data?: any;
  onChange: (data: any) => void;
}

export default function DemographicsForm({ data = {}, onChange }: DemographicsFormProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age-range">Age Range</Label>
          <Select
            value={data.ageRange || ''}
            onValueChange={(value) => handleChange('ageRange', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18-24">18-24</SelectItem>
              <SelectItem value="25-34">25-34</SelectItem>
              <SelectItem value="35-44">35-44</SelectItem>
              <SelectItem value="45-54">45-54</SelectItem>
              <SelectItem value="55-64">55-64</SelectItem>
              <SelectItem value="65+">65+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={data.gender || ''}
            onValueChange={(value) => handleChange('gender', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g., United States, Europe"
          value={data.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="income">Income Level</Label>
        <Select
          value={data.incomeLevel || ''}
          onValueChange={(value) => handleChange('incomeLevel', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select income level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Income</SelectItem>
            <SelectItem value="middle">Middle Income</SelectItem>
            <SelectItem value="upper-middle">Upper Middle Income</SelectItem>
            <SelectItem value="high">High Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="education">Education Level</Label>
        <Select
          value={data.education || ''}
          onValueChange={(value) => handleChange('education', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high-school">High School</SelectItem>
            <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
            <SelectItem value="masters">Master's Degree</SelectItem>
            <SelectItem value="doctorate">Doctorate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">Occupation</Label>
        <Input
          id="occupation"
          placeholder="e.g., Marketing Manager, Software Engineer"
          value={data.occupation || ''}
          onChange={(e) => handleChange('occupation', e.target.value)}
        />
      </div>
    </div>
  );
}
