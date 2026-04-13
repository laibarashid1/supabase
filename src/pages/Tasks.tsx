import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit3, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';

interface Task {
  id: string;
  title: string;
  Description: string;
  created_at?: string;
}

const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch tasks from Supabase
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task') // Use your 'task' table
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error.message);
      alert('Error fetching tasks. Make sure table "task" exists with columns "title" and "des".');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 2. Add or Update a task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      handleUpdate();
    } else {
      handleAdd();
    }
  };

  const handleAdd = async () => {
    try {
      const { data, error } = await supabase
        .from('task')
        .insert([{ title: title, Description: description }]) // Using 'Description' column
        .select();

      if (error) throw error;

      if (data) {
        setTasks([data[0], ...tasks]);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error adding task:', error.message);
      alert('Error adding task. Check your table schema.');
    }
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    try {
      const { data, error } = await supabase
        .from('task')
        .update({ title: title, Description: description })
        .eq('id', editingTask.id)
        .select();

      if (error) throw error;

      if (data) {
        setTasks(tasks.map(t => t.id === editingTask.id ? data[0] : t));
        resetForm();
      }
    } catch (error: any) {
      console.error('Error updating task:', error.message);
      alert('Error updating task.');
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.Description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEditingTask(null);
  };

  // 3. Delete a task
  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('task')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error: any) {
      console.error('Error deleting task:', error.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '6rem 2rem 2rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }}>
      <button
        onClick={() => navigate('/')}
        className="glass"
        style={{
          position: 'absolute',
          top: '6rem',
          left: '2rem',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderRadius: 'var(--radius)',
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.9rem'
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: '2.5rem', marginBottom: '1rem' }}
      >
        Task Manager CRUD
      </motion.h1>

      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="glass"
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius)',
            color: 'white',
            outline: 'none',
            fontSize: '1rem'
          }}
        />
        <textarea
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="glass"
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius)',
            color: 'white',
            outline: 'none',
            fontSize: '1rem',
            minHeight: '100px',
            resize: 'vertical'
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'white',
              color: 'black',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
          >
            {editingTask ? <Edit3 size={18} /> : <Plus size={18} />}
            {editingTask ? 'Update Task' : 'Add Task'}
          </button>
          
          {editingTask && (
            <button
              type="button"
              onClick={resetForm}
              className="glass"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius)',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </motion.form>

      <div style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="glass"
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{task.title}</h3>
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>
                  {task.Description}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleEditClick(task)}
                    className="glass"
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.8rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && tasks.length === 0 && (
          <p style={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: '2rem' }}>
            No tasks found in Supabase. Add one above!
          </p>
        )}
      </div>
    </div>
  );
};

export default Tasks;
