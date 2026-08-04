import {Component, type ErrorInfo, type ReactNode} from 'react';
import {ArrowLeft, House, RefreshCw, TriangleAlert} from 'lucide-react';
import {Link} from 'react-router-dom';

type Props = {children: ReactNode};
type State = {error: Error | null};

export class AdminRouteBoundary extends Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TimeForge] Admin route failed to render.', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <section className="tf54-admin-route-error" role="alert">
      <span><TriangleAlert/></span>
      <small>ADMIN RECOVERY</small>
      <h2>Trang này chưa thể hiển thị</h2>
      <p>Dữ liệu của mục này có thể đang dùng định dạng cũ. Bạn có thể thử lại hoặc quay về trang tổng quan mà không làm mất dữ liệu.</p>
      <div>
        <button type="button" onClick={() => window.location.reload()}><RefreshCw/>Thử tải lại</button>
        <button type="button" className="secondary" onClick={() => window.history.back()}><ArrowLeft/>Quay lại</button>
        <Link to="/admin"><House/>Trang tổng quan</Link>
      </div>
      <details><summary>Chi tiết kỹ thuật</summary><code>{this.state.error.message}</code></details>
    </section>;
  }
}
