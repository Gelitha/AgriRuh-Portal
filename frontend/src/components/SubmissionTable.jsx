import React from 'react';

const SubmissionTable = ({ submissions, isStudent = false }) => {
  const getStatusBadge = (status) => {
    const statusColors = {
      on_time: '#2f7d57',
      late: '#c47d2c',
      closed: '#b3473a',
      draft: '#8a7d77',
    };

    const statusLabels = {
      on_time: '✅ On Time',
      late: '⏱️ Late',
      closed: '❌ Closed',
      draft: '📝 Draft',
    };

    return (
      <span
        style={{
          backgroundColor: statusColors[status] || '#8a7d77',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '0.875rem',
        }}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      {submissions && submissions.length > 0 ? (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: '#fbfef9',
            boxShadow: '0 12px 28px rgba(34,62,42,0.08)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: 'rgba(154, 182, 127, 0.16)', borderBottom: '1px solid rgba(47, 107, 79, 0.12)' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2f211d' }}>
                Session
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2f211d' }}>
                Subject
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#2f211d' }}>
                Submitted
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2f211d' }}>
                Status
              </th>
              {!isStudent && (
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2f211d' }}>
                  Marks
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission, index) => (
              <tr
                key={submission.id || index}
                style={{
                  borderBottom: '1px solid rgba(47, 107, 79, 0.1)',
                }}
              >
                <td style={{ padding: '12px', color: '#6f5e58' }}>
                  {submission.session?.id || submission.session_id || '-'}
                </td>
                <td style={{ padding: '12px', color: '#6f5e58' }}>
                  {submission.session?.subject || submission.subject || '-'}
                </td>
                <td style={{ padding: '12px', color: '#6f5e58' }}>
                  {formatDate(submission.submission_time || submission.created_at)}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {getStatusBadge(submission.status)}
                </td>
                {!isStudent && (
                  <td style={{ padding: '12px', textAlign: 'center', color: '#6f5e58' }}>
                    {submission.marks ? `${submission.marks.obtained_marks}/${submission.marks.total_marks}` : '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: '#8a7d77' }}>
          <p>No submissions to display</p>
        </div>
      )}
    </div>
  );
};

export default SubmissionTable;
