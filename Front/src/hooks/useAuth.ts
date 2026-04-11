import { useAppSelector } from './store';

export const useAuth = () => {
    // سحب التوكنات من الـ Slices المختلفة لضمان التحقق من أي نوع دخول
    const { token } = useAppSelector((state) => state.user);
    // نفترض أن بيانات الأدمن والدكتور تُخزن في Slices خاصة بها أو نفس الـ Slice
    // isLoggedIn هتبقى true لو أي توكن من الثلاثة موجود
    
    return {
        isLoggedIn: !!token,
        token
    };
};