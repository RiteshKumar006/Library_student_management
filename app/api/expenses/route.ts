import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { ApiResponse, Expense } from '@/types';

// GET - List all library expenses
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const expenses = await db
      .collection('expenses')
      .find({})
      .sort({ expenseDate: -1 })
      .toArray();

    return NextResponse.json(
      { success: true, data: expenses, message: 'Expenses fetched successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST - Record library expense
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, amount, expenseDate, category, paymentMethod, notes } = body;

    if (!title || !amount || !expenseDate || !category || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    const newExpense: Expense = {
      title,
      amount: parseFloat(amount),
      expenseDate: new Date(expenseDate),
      category,
      paymentMethod,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    const result = await db.collection('expenses').insertOne(newExpense);

    return NextResponse.json(
      {
        success: true,
        data: { _id: result.insertedId, ...newExpense },
        message: 'Expense recorded successfully',
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT - Update library expense
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid expense ID' } as ApiResponse,
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, amount, expenseDate, category, paymentMethod, notes } = body;

    if (!title || !amount || !expenseDate || !category || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' } as ApiResponse,
        { status: 400 }
      );
    }

    const updateData: Partial<Expense> = {
      title,
      amount: parseFloat(amount),
      expenseDate: new Date(expenseDate),
      category,
      paymentMethod,
      notes: notes || '',
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    const result = await db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' } as ApiResponse,
        { status: 404 }
      );
    }

    // Fetch the updated expense
    const updatedExpense = await db.collection('expenses').findOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      { success: true, data: updatedExpense, message: 'Expense updated successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE - Remove library expense
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid expense ID' } as ApiResponse,
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const result = await db.collection('expenses').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Expense not found' } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Expense deleted successfully' } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as ApiResponse,
      { status: 500 }
    );
  }
}
