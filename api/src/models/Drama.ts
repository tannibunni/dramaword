import { Schema, model, Document } from 'mongoose';

export interface IDrama extends Document {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'tv';
  status: 'want' | 'watching' | 'completed' | 'dropped';
  platform?: string;
  notes?: string;
  posterPath?: string;
  overview?: string;
  releaseDate?: string;
  tmdbRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DramaSchema = new Schema<IDrama>({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  originalTitle: { type: String },
  type: { type: String, enum: ['movie', 'tv'], required: true },
  status: {
    type: String,
    enum: ['want', 'watching', 'completed', 'dropped'],
    default: 'want',
  },
  platform: { type: String },
  notes: { type: String },
  posterPath: { type: String },
  overview: { type: String },
  releaseDate: { type: String },
  tmdbRating: { type: Number },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
});

const Drama = model<IDrama>('Drama', DramaSchema);

export default Drama; 