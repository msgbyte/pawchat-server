import React, { useEffect } from 'react';
import { useAsyncFn } from '@capital/common';
import { TaskItemType } from './type';
import { TaskItem } from './TaskItem';
import { NewTask } from './NewTask';
import { Translate } from '../translate';
import { request } from '../request';
import './index.less';

const TasksPanel: React.FC = React.memo(() => {
  const [{ value }, fetch] = useAsyncFn(() =>
    request.get('all').then(({ data }) => data)
  );
  const tasks: TaskItemType[] = Array.isArray(value) ? value : [];

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="plugin-tasks-panel">
      <div className="plugin-task-title">{Translate.tasks}</div>

      <NewTask onSuccess={fetch} />

      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} />
      ))}
    </div>
  );
});
TasksPanel.displayName = 'TasksPanel';

export default TasksPanel;
