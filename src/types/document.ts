export interface Document {
	id: string
	title: string
	content: string
	createdAt: Date
	updatedAt: Date
}

export interface DocumentWithBlocks extends Document {
	blockIds: string[]
}